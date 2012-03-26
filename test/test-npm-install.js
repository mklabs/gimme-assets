
var fs = require('fs'),
  path = require('path'),
  assert = require('assert'),
  gimme = require('../');

gimme.fetch('http://nodeload.github.com/mklabs/node-tabtab/tarball/master', function(e, installed, deps) {
  assert.ifError(e);
  assert.ok(installed);
  assert.ok(deps.length);
});

