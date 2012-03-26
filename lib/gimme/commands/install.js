
var fs = require('fs'),
  path = require('path'),
  join = require('path').join,
  gimme = require('../../../'),
  async = gimme.utile.async,
  mkdirp = gimme.utile.mkdirp;

module.exports = install;

install.description = ['install', 'Installs the lib(s) <name ...>'];

install.usage = [
  'gimme install <asset>',
  'gimme install <asset> <asset ...>'
].join('\n');

install.complete = function complete(o, cb) {
  cb(null, this.commands.list.packages('name', this.get('prefix')));
};

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
    app.info('Install done in', (+new Date - date) / 1000);
    cb();
  });
}

function installPkg(app, output, packages, config, pkglist) { return function(lib, cb) {
  if(!~pkglist.indexOf(lib)) return cb(new Error('Unknown lib "' + lib + '" to install. Try `gimme list`'));

  // let's isolate the correct package
  var pkg = packages.filter(function(p) { return p.name === lib; })[0];

  var sources = pkg.source,
    ln = sources.length,
    cdnjs = pkg.cdnjs;

  // some defaults for packages
  pkg.branch = pkg.branch || 'master';

  // case of cdnjs, copy right away
  if(cdnjs) return next(null, sources, pkg);

  // everything that's not a cnjs package, fetch locally first
  var url = 'http://' + join('nodeload.github.com/', pkg.repo, 'tarball', pkg.branch);
  app.fetch(url, pkg, function(e, installed, deps) {
    if(e) return cb(e);
    next(null, sources, pkg);
  });

  function next(err, sources, pkg) {
    if(err) return cb(err);
    async.forEach(sources, installOne(app, output, config, pkg), function(err) {
      if(err) return cb(err);
      cb();
    });
  }

}}

function installOne(app, output, config, pkg) {
  // update ouptut if pkg has `dir` prop
  output = path.resolve(config.base, pkg.dir || output);

  return function(source, cb) {
    var cdnjs = pkg.repo === 'cdnjs/cdnjs',
      filepath = path.join('ajax/libs', pkg.name, pkg.version, source),
      from = path.join(config.prefix, filepath),
      to = path.join(output, path.basename(filepath));

    // not supported yet, raw urls on something else than github repos
    if(/^https?:\/\//.test(source)) {
      return cb(new Error('Source url not supported yet, must be within a github repo: ' + source));
    }

    app.debug(cdnjs)
      .debug(filepath)
      .debug({
        from: from,
        to: to
      });

    // check cache
    fs.readFile(from, function(e) {
      // file already fetched, copy right away
      if(!e) return next(null, from, to);

      var nm = join(config.prefix, 'node_modules'),
        file = cdnjs ? join(nm, 'cdnjs', filepath) : join(nm, pkg.name, source);

      copy(config, file, from, function(e) {
        if(e) return cb(e);
        next(null, from, to);
      });
    });

    function next(e, from, to) {
      if(e) return cb(e);
      app.emit('fetched', pkg, from, to);
      app.emit('installed', pkg, from, to);
      app.emit('install', pkg, from, to);
      copy(config, from, to, cb);
    }
  }
}


function copy(config, src, dest, cb) {
  if(config.dry) return cb();
  mkdirp(path.dirname(dest), 0755, function(err) {
    if(err) return cb(err);
    fs.readFile(src, function(err, body) {
      if(err) return cb(err);
      fs.writeFile(dest, body, cb);
    });
  });
}

function copySync(src, dest) {
  fs.writeFileSync(dest, fs.readFileSync(src));
}

function join() {
  var args = Array.prototype.slice.call(arguments);
  return path.join.apply(path, args).replace(/\\/g, '/');
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
