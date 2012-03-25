
var fs = require('fs'),
  path = require('path'),
  gh = require('../fetch'),
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
  cb(null, app.commands.list.packages('name', app.get('prefix')));
};

function install(opts, cb) {
  var libs = opts.argv.remain.slice(1),
    remaining = libs.length,
    output = opts.output || 'js/libs',
    app = this,
    config = app.get();

  config.base = config.base || process.cwd();
  config.dry = opts.dry || false;

  if(!remaining) return cb(new Error(install.usage));

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
    ln = sources.length;

  return async.forEach(sources, installOne(app, output, config, pkg), function(err) {
    if(err) return cb(err);
    cb();
  });
}}

function installOne(app, output, config, pkg) {
  // update ouptut if pkg has `dir` prop
  output = path.resolve(config.base, pkg.dir || output);

  return function(source, cb) {
    var cdnjs = pkg.repo === 'cdnjs/cdnjs',
      whereto = cdnjs ? config.prefix : path.join(config.prefix, 'ajax/libs', pkg.name),
      filepath = path.join('ajax/libs', pkg.name, pkg.version, source),
      from = path.join(config.prefix, filepath),
      to = path.join(output, path.basename(filepath));

    // not supported yet, raw urls on something else than github repos
    if(/^https?:\/\//.test(source)) {
      return cb(new Error('Source url not supported yet, must be within a github repo: ' + source));
    }

    fs.readFile(to, function(e) {
      // file already fetched, copy right away
      if(!e) return next(null, from, to);
      // map source to the correct repo filepath, in case of cdnjs
      source = cdnjs ? ['ajax/libs', pkg.name, pkg.version, source].join('/') : source;
      fetch(pkg.repo, pkg.branch, source, whereto, function(e) {
        if(e) return next(e);
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

function fetch(repo, branch, files, whereto, cb) {
  return gh.fetch([repo].concat(files), { whereto: whereto, branch: branch }, cb);
}

function join() {
  var args = Array.prototype.slice.call(arguments);
  return path.join.apply(path, args).replace(/\\/g, '/');
}
