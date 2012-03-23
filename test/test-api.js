
var assert = require('assert');

var gimme = require('..');


// test basic flatiron app api
['options', 'env', 'plugins', 'config'].forEach(function(prop) {
  assert.ok(gimme[prop]);
});

// test flatiron cli plugin api
['argv', 'cli', 'cmd', 'usage', 'commands'].forEach(function(prop) {
  assert.ok(gimme[prop]);
});

