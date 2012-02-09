
var fs = require('fs'),
  path = require('path'),
  async = require('async'),
  mkdirp = require('mkdirp'),
  gh = require('gh-fetch'),
  gimme = require('../../'),
  log = gimme.log,
  config = gimme.config,
  commands = gimme.commands,
  prefix = config.defaults.prefix;

module.exports = install;

install.description = ['install <name ...>', 'Installs the lib(s) <name ...>'];

install.usage = [
  'gimme install <asset>',
  'gimme install <asset> <asset ...>'
].join('\n');

install.complete = function complete(o, cb) {
  gimme.load(function() {
    cb(null, commands.list.packages('name'));
  });
};

function install(opts, cb) {

  var libs = opts.argv.remain.slice(1),
    remaining = libs.length,
    output = opts.output || 'js/libs';

  if(!remaining) return cb(new Error(install.usage));

  log.log('Installing...', libs.join(' '));

  var pkgs = commands.list.packages(),
    pkglist = pkgs.map(function(p) { return p.name; });

  async.forEach(libs, installPkg(output, pkgs, pkglist), function(err) {
    if(err) return cb(err);
    log.log('all done');
    cb();
  });
}

function installPkg(output, packages, pkglist) { return function(lib, cb) {

  if(!~pkglist.indexOf(lib)) return cb(new Error('Unknown lib "' + lib + '" to install. Try `gimme list`'));

  // let's isolate the correct package
  var pkg = packages.filter(function(p) { return p.name === lib; })[0];

  var sources = pkg.source,
    ln = sources.length;

  return async.forEach(sources, installOne(output, pkg), function(err) {
    if(err) return cb(err);
    cb();
  });
}}

function installOne(output, pkg) { return function(source, cb) {
  var cdnjs = pkg.repo === 'cdnjs/cdnjs',
    whereto = cdnjs ? prefix : path.join(prefix, 'ajax/libs', pkg.name),
    filepath = path.join('ajax/libs', pkg.name, pkg.version, source),
    destpath = path.join(output, path.basename(filepath)),
    abspath = path.join(prefix, filepath);

  // not supported yet, raw urls on something else than github repos
  if(/^https?:\/\//.test(source)) {
    return cb(new Error('Source url not supported yet, must be within a github repo: ' + source));
  }

  fs.readFile(abspath, function(e) {
    // file already fetched, copy right away
    if(!e) return copy(abspath, destpath, cb);

    // map source to the correct repo filepath, in case of cdnjs
    source = cdnjs ? ['ajax/libs', pkg.name, pkg.version, source].join('/') : source;


    var proxyErr = [
      'Request timeout: You may be behind an http proxy.',
      '',
      'Try setting up $http_proxy environement variable: ',
      '',
      'Unixes:',
      '   export http_proxy=http://proxy:port',
      '',
      'Windows:',
      '   set http_proxy=http://proxy:port',
      ''
    ].join(config.defaults.lr);

    // up to 10s, ok. If it exceeds assume a proxy environement with
    // no $http_proxy setup.
    var to = setTimeout(cb.bind({}, new Error(proxyErr)), 10000);
    fetch(pkg.repo, pkg.branch, source, whereto, function(e) {
      clearTimeout(to);
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
