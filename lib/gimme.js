
var flatiron = require('flatiron'),
  join = require('path').join;

var gimme = module.exports = flatiron.app;

gimme.util = gimme.utile = flatiron.common;

// attach config
gimme.use(require('./gimme/plugins/config'));

// attach logger module for later use
gimme.use(require('./gimme/plugins/log'));

// the core custom cli plugin
gimme.use(require('./gimme/plugins/cli'), {
  usage: [
    '',
    'Experimental asset manager for cdnjs / microjs libs.',
    '',
    'Usage: gimme <cmd> [options]',
    '',
    'Commands:',
    '$commands',
    '',
    'Options:',
    '$options',
    ''
  ],
  dir: [join(__dirname, 'gimme/commands'), gimme.config.get('usercommands')],
  nopt: [gimme.config.get('types'), gimme.config.get('shorthands'), process.argv, 2]
});

// setup loglvl once options have been parsed
gimme.log.level(gimme.get('loglevel'));

// special `load` bootstrap function
gimme.use(require('./gimme/load'));


