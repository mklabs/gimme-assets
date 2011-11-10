#!/usr/bin/env node

var path = require('path'),
  exec = require('child_process').exec,
  console = require('../lib/logger');

var prefix = path.join(process.env.HOME, '.gimme-assets');

// use the http clone url, works better with proxies (should be made configurable)


// On package install, clone the cdnjs repo into ~/.gimme-assets/cdnjs

// * todo: clone/pull if directory exists, instead of raw remove

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
      });
    });
  });
}

function mkdirp(path, cb) {
  return exec('mkdir -p ' + path, cb);
}

