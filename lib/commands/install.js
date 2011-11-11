
var npm = require('npm'),
  semver = require('semver'),
  path = require('path'),
  fs = require('fs'),
  exec = require('child_process').exec,
  prefix = path.join(process.env.HOME, '.gimme-assets', 'cdnjs'),
  console = require('../logger');

module.exports = install;

install.description = ['install <name ...>', 'installs the lib <name ...>'];

install.usage = [
  'gimme install <asset>',
  'gimme install <asset> <asset ...>'
].join('\n');

function install(opts, cb) {

  var libs = opts.argv.remain.slice(1),
    remaining = libs.length,
    output = opts.output || 'js/libs';

  if(!remaining) return cb(new Error(install.usage));

  console.log('Installing...', libs.join(' '));

  var pkgs = libs.map(function(name) {
    var parts = name.split('@');
    return path.join(prefix, 'ajax', 'libs', parts[0]);
  });


  npm.load(opts, function() {
    npm.commands.install(pkgs, function(err) {
      if(err) return cb(err);

      var remaining = libs.length;

      console.debug('Return the highest version in the list that satisfies the range (or `*` by defaults)');
      libs.forEach(function(lib) {
        var parts = lib.split('@'),
          name = parts[0],
          version = parts[1] || '*',
          pkg = path.resolve('./node_modules', name),
          versions = fs.readdirSync(pkg).filter(function(version) {
            return fs.statSync(path.join(pkg, version)).isDirectory();
          });

        version = semver.maxSatisfying(versions, version);
        if(!version) return cb(new Error('version not found: ' + lib + '. ' + ['Available:'].concat(versions).join('\n » ')));
        console.info('Installing', [name, version].join('@'), 'into', output);

        pkg = path.join(pkg, version);

        console.debug('Copying', pkg, ' → ', path.resolve(output));

        copy(pkg + '/*', path.resolve(output), function(err) {
          if(err) return cb(err);
          if(--remaining) return;
          cb();
        });
      });
    });
  });
}


function copy(from, to, cb) {
  exec('mkdir -p ' + to, function(err) {
    if(err) return cb(err);

    exec('cp -vr ' + from + ' ' + to, function(err, stdout) {
      if(err) return cb(err);
      console.debug(stdout);
      cb();
    });
  });
}
