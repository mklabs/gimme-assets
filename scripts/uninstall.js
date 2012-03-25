var path = require('path'),
  gimme = require('../');

require('rimraf').sync(path.join(gimme.config.defaults.home, '.gimme'));
