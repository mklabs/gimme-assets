
var fs = require('fs'),
  path = require('path'),
  async = require('async'),
  mkdirp = require('mkdirp'),
  gh = require('gh-fetch'),
  commands = require('../commands'),
  console = require('../logger');

var prefix = path.join(process.env.HOME, '.gimme');

module.exports = install;

install.description = ['install <name ...>', 'installs the lib <name ...>'];

install.usage = [
  'gimme install <asset>',
  'gimme install <asset> <asset ...>'
].join('\n');

install.complete = function complete(o, cb) {
  var names = commands.list.packages().map(function(pkg) { return pkg.name; });
  cb(null, names);
};

function install(opts, cb) {

  var libs = opts.argv.remain.slice(1),
    remaining = libs.length,
    output = opts.output || 'js/libs';

  if(!remaining) return cb(new Error(install.usage));

  console.log('Installing...', libs.join(' '));

  var pkgs = commands.list.packages(),
    pkglist = pkgs.map(function(p) { return p.name; });

  async.forEach(libs, installOne(output, pkgs, pkglist), function(err) {
    if(err) return cb(err);
    console.log('all done');
  });
}

function installOne(output, packages, pkglist) { return function(lib, cb) {

  if(!~pkglist.indexOf(lib)) return cb(new Error('Unknown lib "' + lib + '" to install. Try `gimme list`'));

  // let's isolate the correc package
  var pkg = packages.filter(function(p) { return p.name === lib; })[0];

  // let's validate and sanitize a little bit, some have no filename, some others have no..
  if(!pkg.filename) {
    console.error(pkg);
    return cb(new Error('Unable to find the pkg.filename for ' + lib + ' --> '));
  }

  // First, let's check the local cache
  var filepath = path.join('ajax/libs', pkg.name, pkg.version, pkg.filename),
    abspath = path.join(prefix, filepath),
    destpath = path.join(output, path.basename(filepath));


  fs.readFile(abspath, 'utf8', function(err) {
    if(!err) copy(abspath, destpath, cb);

    fetch(filepath, function(err) {
      if(err) return cb(err);
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

function fetch(file, cb) {
  return gh.fetch(['cdnjs/cdnjs', file], { whereto: prefix }, cb);
}
