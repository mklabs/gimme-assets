

var assert = require('assert');

var gimme = require('..');
//
// App creation
// ------------
//
gimme.info('Should be able to create new app with gimme.create');
var app = gimme.create();
app.info('And this should be another instance');
assert.ok(app !== gimme);

//
// ## Testing events
//
var to = setTimeout(function() { assert.fail('Fail!'); }, 500);
var init = setTimeout(function() { assert.fail('Fail!'); }, 500);
var start = setTimeout(function() { assert.fail('Fail!'); }, 500);
app.on('SAVE THE TESTS!!', function() {
  clearTimeout(to);
});

app.on('init', function() {
  gimme.debug('gimme should emit an `init` event when started');
  clearTimeout(init);
});

app.on('start', function() {
  gimme.debug('gimme should emit a `start` event when started');
  clearTimeout(start);
});

app.on('end', app.emit.bind(app, 'SAVE THE TESTS!!'));

// start!
app.start();

