#!/usr/bin/env node

var path = require('path'),
  semver = require('semver'),
  exec = require('child_process').exec,
  fs = require('fs'),
  console = require('../lib/logger');

var prefix = path.join(process.env.HOME, '.gimme-assets');

// use the http clone url, works better with proxies (should be made configurable)


// On package install, clone the cdnjs repo into ~/.gimme-assets/cdnjs

// * todo: clone/pull if directory exists, instead of raw remove
// * todo: validate each pacakge.json, edit version to be semver compliant if necessary (add a `.x` to versions like `1.0`)

// Get the git http.proxy config, if set then use git over http, otherwise standard git clone.
exec('git config --global http.proxy', function(err, stdout) {
  var url = 'git://github.com/cdnjs/cdnjs.git';
  if(err && err.code !== 1) throw err;
  if(stdout.trim()) url = 'https://github.com/cdnjs/cdnjs.git';
  install(url);
});


function install(url) {
  exec('rm -rf ' + prefix, function(err) {
    mkdirp(prefix, function(err) {
      if(err) throw err;

      console.info('Cloning cdnjs repository from ', url);
      exec('git clone ' + url + ' ' + path.join(prefix, 'cdnjs'), function(err, stdout, stderr) {
        if(err) throw err;
        console.debug(stdout, stderr);
        console.info(' ✔ Cloned cdnjs repo in ~/.gimme-assets');

        console.debug('Checking out package.json version against semver, adding necessary `.x` on `1.0` if needed.');

        var libs = path.join(prefix, 'cdnjs', 'ajax', 'libs');

        fs.readdirSync(libs)
          .filter(function(file) {
            return fs.statSync(path.join(libs, file)).isDirectory();
          })
          .forEach(function(file) {
            var pkgpath = path.join(libs, file, 'package.json'),
              pkg = JSON.parse(fs.readFileSync(pkgpath)),
              version = pkg.version,
              parts = pkg.version.split('.');

            if(!semver.satisfies(version, '*')) {
              if(parts.length !== 2) return console.warn('Invalid version field: ', pkg.version, 'for', pkg.name);
              console.info('Updating version', version, 'for ', pkg.name);

              // also needs to concat the last minor version part to package folders too(0.6, 0.7, etc.)
              pkg.version = parts.concat('0').join('.');

              console.debug('Writing new pkg:', pkgpath, version, ' → ', pkg.version);
              fs.writeFileSync(pkgpath, JSON.stringify(pkg, null, 2))
            }
          });
      });
    });
  });
}

function mkdirp(path, cb) {
  return exec('mkdir -p ' + path, cb);
}

