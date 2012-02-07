
var gimme = exports;

// attach logger module for later use
gimme.log = require('./utils/logger');

// map over the ``commands` dir, setup all commands as lazy-loaded
// getters. Grab any built-in commands (in `./commands`), then lookup
// for `~/.gimme/commands` and include any user specific commands.
gimme.commands = gimme.cmds = require('./commands');

// special `load` bootstrap function
gimme.load = require('./utils/load');
