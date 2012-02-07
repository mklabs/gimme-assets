
var fs = require('fs'),
  path = require('path'),
  fetch = require('gh-fetch').fetch,
  log = require('./logger');

// the .gimme dir, where should the fetch be done
var prefix = path.join(process.env.HOME, '.gimme');

// cdnjs packages installer
//
// Ensure the `~/.gimme/packages.json` is here. Only fetch from remote
// if the file isnn't already there, may force the update if force param is
// passed in.
//

module.exports = function(force, cb) {
  if(!cb) {
    cb = force;
    force = false;
  }

  var pkgfile = path.join(prefix, 'packages.json');
  return fs.stat(pkgfile, function(e) {
    if(!e && !force) return cb();
    if(!force) log.info('Unable to find ~/.gimme/packages.json, fetch in the first place.');
    else log.info('Forced update of ~/.gimme/package.json');
    return fetch(['cdnjs/website', 'packages.json'], { branch: 'gh-pages', whereto: prefix }, cb);
  });
};

