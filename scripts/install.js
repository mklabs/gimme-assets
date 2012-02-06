
var fs = require('fs'),
  path = require('path'),
  rimraf = require('rimraf'),
  gh = require('gh-fetch'),
  log = require('../lib/logger');

var prefix = path.join(process.env.HOME, '.gimme');

log.log('run newinstall', prefix);

// What shis script shoul do
//
// * wipe out previous ~/.gimme dir if any
// * Grab latest copy of https://raw.github.com/cdnjs/website/gh-pages/packages.json
// * Store anc cache it in ~/.gimme
//

// fetch latest copy of cdnjs' packages
var fetcher = gh.fetch(['cdnjs/website', 'packages.json'], { branch: 'gh-pages', whereto: prefix }, function(err) {
  log.debug('fetch done', arguments);

  // Try to parse its content
  var pkgs = JSON.parse(fs.readFileSync(path.join(prefix, 'packages.json'), 'utf8'));
  console.log(pkgs);

});

