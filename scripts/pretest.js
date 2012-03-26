
var join = require('path').join,
  gimme = require('..');

// pretest script

var testdir = join(__dirname, '../test/fixtures');
gimme.util.rimraf.sync(testdir);

// init prefix dir
gimme.set('prefix', testdir).start();
