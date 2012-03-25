
var assert = require('assert'),
  path = require('path'),
  join = path.join;

var dir = path.join(__dirname, 'libs');
process.argv = process.argv.concat(['install', 'jquery', 'underscore.js', '-o', dir]);

var gimme = require('..');

// remove previous test run
gimme.utile.rimraf.sync(join(__dirname, 'fixtures/ajax'));
gimme.utile.rimraf.sync(join(__dirname, 'libs'));
gimme.set('prefix', join(__dirname, 'fixtures'));
gimme.start(function(err) {
  assert.ifError(err);
  assert.ok(path.existsSync(join(dir, 'jquery.min.js')));
  assert.ok(path.existsSync(join(dir, 'underscore-min.js')));
});

