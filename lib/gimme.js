
var flatiron = require('flatiron'),
  join = require('path').join,
  config = require('./gimme/plugins/config'),
  logger = require('./gimme/plugins/log'),
  cli = require('./gimme/plugins/cli'),
  fetch = require('./gimme/utils/fetch'),
  load = require('./gimme/load');

var gimme = module.exports = create();

// add a create method to the app object, should we need to create a new gimme instance
// (actually a new flatiron app)
gimme.create = create;

// expose the internal fetch handler, thin facade on top of npm's install
gimme.fetch = fetch.bind(gimme);

// **create** Initializes a new flatiron application, with plugins
// and configuration setup.
function create(options) {
  var app = new flatiron.App(options);

  // defaults for options
  options = options || {};
  options.cli = options.cli || {};
  options.argv = options.argv || options.cli.argv || process.argv.slice(2);

  // attach utile and common utilities from flatiron as util or utile
  app.util = app.utile = flatiron.common;

  // attach config
  app.use(config, options.config);

  // attach logger module for later use
  app.use(logger);

  // the core custom cli plugin
  app.use(cli, {
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
    dir: options.cli.dir || [join(__dirname, 'gimme/commands'), app.config.get('usercommands')],
    nopt: [app.config.get('types'), app.config.get('shorthands')].concat([options.argv, 0])
  });

  // setup loglvl once options have been parsed
  app.log.level(app.get('loglevel'));

  // special `load` bootstrap function
  app.use(load);

  return app;
};

