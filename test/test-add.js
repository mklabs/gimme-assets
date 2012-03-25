
var assert = require('assert'),
  path = require('path'),
  join = path.join,
  gimme = require('..');

var dir = path.join(__dirname, 'libs');

// remove previous test run
gimme.utile.rimraf.sync(join(__dirname, 'fixtures/ajax'));
gimme.utile.rimraf.sync(join(__dirname, 'libs'));

// the command to tests
var cmds = {};
cmds.add = [
  'add',
  '--name', 'normalize',
  '--description', 'Test normalize package',
  '--repo',  'necolas/normalize.css',
  '--source', 'normalize.css',
  '--dir', 'test/css/',
  '--force'
];

cmds.install = 'install normalize'.split(' ');

// app prefix for these instances
var prefix = join(__dirname, 'fixtures');

// create the app with add context
var add = gimme.create({ argv: cmds.add }).set('prefix', prefix).on('start', function() {
  add.info('Running command', cmds.add.join(' '));
});

// same for install app
var install = gimme.create({ argv: cmds.install }).set('prefix', prefix).on('start', function() {
  add.info('Running command', cmds.install.join(' '));
});

// add step
add.start().info('add - app started').on('end', function(err) {
  assert.ifError(err);
  // install step
  install.start().info('install - app started').on('end', function(err) {
    assert.ifError(err);
    assert.ok(path.existsSync('test/css/normalize.css'));
    process.exit(0);
  });
});

