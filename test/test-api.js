
var assert = require('assert');

var gimme = require('..');

//
// Api tests
// ---------
//

// test basic flatiron app api
['options', 'env', 'plugins', 'config'].forEach(function(prop) {
  assert.ok(gimme[prop]);
});

// test flatiron cli plugin api
['argv', 'cli', 'cmd', 'usage', 'commands'].forEach(function(prop) {
  assert.ok(gimme[prop]);
});

//
// ## Logger Api
//
gimme.info('Shoule be able to use logger interface');
gimme.info('and setup a different log level');
gimme.log.level('debug');

['debug', 'info', 'warn', 'error'].forEach(function(lvl) {
  gimme[lvl]('with', 'few', 'level', {
    some: {
      obj: 'ect'
    }
  })
});

//
// ## Config Api
//
gimme.debug('and').info('this').warn('should').error('chainable');
assert.ok(gimme.info('same goes for config interface').get())
assert.equal(gimme.set('foobar', 'bar').get('foobar'), 'bar');
assert.equal(gimme.config.env(), 'development');

