
var assert = require('assert'),
  path = require('path');

var dir = path.join(__dirname, 'libs');
process.argv = process.argv.concat(['install', 'jquery', 'underscore.js', '-o', dir]);

var gimme = require('..');
gimme.start(function(err) {
  assert.ifError(err);
  assert.ok(path.existsSync(path.join(dir, 'jquery.min.js')));
  assert.ok(path.existsSync(path.join(dir, 'underscore-min.js')));
});

