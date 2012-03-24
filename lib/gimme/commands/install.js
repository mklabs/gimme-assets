
var fs = require('fs'),
  path = require('path'),
  async = require('async'),
  mkdirp = require('mkdirp'),
  gh = require('../fetch');

module.exports = install;

install.description = ['install <name ...>', 'Installs the lib(s) <name ...>'];

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
    app = this;

  if(!remaining) return cb(new Error(install.usage));

  app.info('Installing...', libs.join(' '));

  var pkgs = app.commands.list.packages(false, app.get('prefix')),
    pkglist = pkgs.map(function(p) { return p.name; });

  var date = +new Date;
  async.forEach(libs, installPkg(output, pkgs, app.get(), pkglist), function(err) {
    if(err) return cb(err);
    app.info('Install done in', (+new Date - date) / 1000);
    cb();
  });
}

function installPkg(output, packages, config, pkglist) { return function(lib, cb) {

  if(!~pkglist.indexOf(lib)) return cb(new Error('Unknown lib "' + lib + '" to install. Try `gimme list`'));

  // let's isolate the correct package
  var pkg = packages.filter(function(p) { return p.name === lib; })[0];

  var sources = pkg.source,
    ln = sources.length;

  return async.forEach(sources, installOne(output, config, pkg), function(err) {
    if(err) return cb(err);
    cb();
  });
}}

function installOne(output, config, pkg) { return function(source, cb) {
  var cdnjs = pkg.repo === 'cdnjs/cdnjs',
    whereto = cdnjs ? config.prefix : path.join(config.prefix, 'ajax/libs', pkg.name),
    filepath = path.join('ajax/libs', pkg.name, pkg.version, source),
    destpath = path.join(output, path.basename(filepath)),
    abspath = path.join(config.prefix, filepath);

  // not supported yet, raw urls on something else than github repos
  if(/^https?:\/\//.test(source)) {
    return cb(new Error('Source url not supported yet, must be within a github repo: ' + source));
  }

  fs.readFile(abspath, function(e) {
    // file already fetched, copy right away
    if(!e) return copy(abspath, destpath, cb);
    // map source to the correct repo filepath, in case of cdnjs
    source = cdnjs ? ['ajax/libs', pkg.name, pkg.version, source].join('/') : source;
    fetch(pkg.repo, pkg.branch, source, whereto, function(e) {
      if(e) return cb(e);
      copy(abspath, destpath, cb);
    });
  });
}}


function copy(src, dest, cb) {
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
