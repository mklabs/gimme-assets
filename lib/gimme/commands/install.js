
var fs = require('fs'),
  path = require('path'),
  gimme = require('../../../'),
  async = gimme.utile.async,
  mkdirp = gimme.utile.mkdirp,
  request = require('../fetch').request,
  fstream = require('fstream'),
  mm = require('minimatch');

module.exports = install;

install.description = ['install', 'Installs the lib(s) <name ...>'];

install.usage = [
  'gimme install <asset>',
  'gimme install <asset> <asset ...>'
].join('\n');

install.complete = function complete(o, cb) {
  cb(null, app.commands.list.packages('name', app.get('prefix')));
};

var write = writer();

function install(opts, cb) {
  var libs = opts.argv.remain.slice(1),
    remaining = libs.length,
    output = opts.output || 'js/libs',
    app = this,
    config = app.get(),
    defaults = defaultInstall.bind(app);

  config.base = config.base || process.cwd();
  config.dry = opts.dry || false;

  // no lib, lookup in $cwd/package.json for a `gimme` prop
  if(!remaining) return defaults(cb);

  app.info('Installing...', libs.join(' '));

  var pkgs = app.commands.list.packages(false, app.get('prefix')),
    pkglist = pkgs.map(function(p) { return p.name; });

  var date = +new Date;
  async.forEach(libs, installPkg(app, output, pkgs, app.get(), pkglist), function(err) {
    if(err) return cb(err);
    console.log();
    app.info('Install done in', (+new Date - date) / 1000);
    cb();
  });
}

function installPkg(app, output, packages, config, pkglist) { return function(lib, cb) {

  if(!~pkglist.indexOf(lib)) return cb(new Error('Unknown lib "' + lib + '" to install. Try `gimme list`'));

  // let's isolate the correct package
  var pkg = packages.filter(function(p) { return p.name === lib; })[0];

  var sources = pkg.source,
    ln = sources.length;

  return async.forEach(sources, installOne(app, output, config, pkg), function(err) {
    if(err) return cb(err);
    cb();
  });
}}

function installOne(app, output, config, pkg) {
  // update ouptut if pkg has `dir` prop
  output = path.resolve(config.base, pkg.dir || output);

  return pkg.custom ? customInstall(app, output, config, pkg) : function (source, cb) {
    var repo = pkg.repo,
      cdnjs = repo === 'cdnjs/cdnjs',
      filepath = path.join('ajax/libs', pkg.name, pkg.version, source),
      cachepath = path.join(config.prefix, filepath),
      dest = path.join(output, path.basename(filepath));

    // guess the correct url
    var pathname = cdnjs ? join(pkg.repo, pkg.branch, filepath) : join(pkg.repo, pkg.branch, source),
      url = 'https://raw.github.com/' + pathname;

    fs.stat(cachepath, function(e) {
      if(!e) return next(cachepath, dest);

      var req = request.get(url).on('error', cb);
      req.on('response', function(res) {
        if(res.statusCode === 200) return;
        var err = new Error('status: ', res.statusCode);
        err.res = res;
      });

      req
        .pipe(fstream.Writer(cachepath))
        .on('error', cb)
        .on('close', function() {
          next(cachepath, dest);
        });

      function next(from, to) {
        app.emit('fetched', pkg, from, to);
        app.emit('installed', pkg, from, to);
        app.emit('install', pkg, from, to);
        copy(from, to, cb);
      }
    });
  };
}

function copy(src, dest, cb) {
  return fstream.Reader(src).pipe(fstream.Writer(dest)).on('close', cb);
}

function join() {
  var args = Array.prototype.slice.call(arguments);
  return path.join.apply(path, args).replace(/\\/g, '/');
}

function writer(prefix) {
  var init = false;
  prefix = '\033[90m' + (prefix || 'download - ') + '\033[39m';
  return function() {
    if(!init) init = true, process.stdout.write(prefix);
    var args = Array.prototype.slice.call(arguments).map(function(s) {
      return '\033[90m' + s + '\033[39m';
    });

    process.stdout.write.apply(process.stdout, args);
  };
}


function defaultInstall(cb) {
  var app = this;
  // should walk the filesystem for a package.json file
  // doing on $ cwd/package.json for now
  fs.readFile('package.json', 'utf8', function(e, body) {
    if(e) return cb(new Error(install.usage));
    var pkg = JSON.parse(body),
      gimme = pkg.gimme;

    if(!gimme) return cb(new Error(install.usage));
    if(!gimme.install) return cb(new Error('Found a gimme prop in package.json file but no gimme.install'));

    var opts = { argv: {} };
    opts.argv.remain = ['install'].concat(gimme.install.split(' '));
    app.commands.install.call(app, opts, cb);
  });
}

function customInstall(app, output, config, pkg) {
  return function(source, cb) {

    // 1. get all blobs from repo, github v2 api.
    // 2. filter and minimatch the results
    // 3. copy all
    var blobs = 'https://github.com/api/v2/json/blob/all/' + pkg.repo + '/' + (pkg.branch || 'master');

    request({ uri: blobs, json: true }, function(err, res) {
      var files = Object.keys(res.body.blobs);
      files = files.filter(mm.filter(source, { matchBase: true }));

      var ln = files.length;
      files.forEach(function(file) {
        var filepath = path.join('ajax/libs', pkg.name, pkg.version, file),
          cachepath = path.join(config.prefix, filepath),
          dest = path.join(output, path.basename(filepath));

        var url = 'https://raw.github.com/' + join(pkg.repo, pkg.branch || 'master', file);
        fs.stat(cachepath, function(e) {
          if(!e) return next(cachepath, dest);

          var req = request.get(url).on('error', cb);
          req.on('response', function(res) {
            if(res.statusCode === 200) return;
            var err = new Error('status: ', res.statusCode);
            err.res = res;
          });

          req
            .pipe(fstream.Writer(cachepath))
            .on('error', cb)
            .on('close', function() {
              next(cachepath, dest);
            });

          function next(from, to) {
            write('.');
            app.emit('fetched', pkg, from, to);
            app.emit('installed', pkg, from, to);
            app.emit('install', pkg, from, to);
            copy(from, to, cb);
          }
        });
      });
    });
  };
}
