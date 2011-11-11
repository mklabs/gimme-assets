
var fs = require('fs'),
  path = require('path');

// map over the `commands` dir, setup all commands as lazy-loaded getters and
// return the cmd name in the `known` array.
var cmds = exports;

fs.readdirSync(path.join(__dirname, '..', 'lib', 'commands')).forEach(function(file) {
  var command = file.replace(path.extname(file), '');

  cmds.__defineGetter__(command, function() {
    return require('../lib/commands/' + command);
  });

  return command;
});
