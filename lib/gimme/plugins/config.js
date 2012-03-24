
// nopt defaults config, types and shorthands


var plugin = exports,
  path = require('path'),
  nopt = require('nopt'),
  cfg = require('cfg'),
  env = process.env,
  win32 = process.platform === 'win32',
  home = win32 ? env.USERPROFILE : env.HOME;

var config = {};

// may ends up attached directly on config
config.defaults = {
  home: home,
  windows: win32,
  win32: win32,
  lr: win32 ? '\r\n' : '\n',
  prefix: path.resolve(home, '.gimme'),
  usercommands: path.join(home, '.gimme/commands'),
  loglevel: 'info',
  output: './js/libs',
  debug: false,
  limit: 0,
  props: ['name', 'description', 'version', 'homepage', 'keywords', 'repo', 'branch', 'source', 'repositories']
};

config.types = {
  loglevel: ['error', 'warn', 'info', 'log', 'debug'],
  output: String,
  version: Boolean,
  debug: Boolean,
  limit: Number,
  props: [String, Array],
  help: Boolean,
  usage: Boolean
};

config.descriptions = {
  loglevel  : 'What level of log to report',
  output    : 'Output directory, defaults to ./js/libs',
  version   : 'Output program version',
  help      : 'Display help information',
  debug     : 'Slighly more verbose error output when set to true, defaults false',
  limit     : 'Maximum number of results to output with paginated list',
  props     : 'Optional list of package property to output during listing'
};

config.shorthands = {
  d: ['--debug'],
  o: ['--output'],
  l: ['--loglevel'],
  h: ['--help'],
  v: ['--version'],
  ll: ['--limit']
};

// **attach** sets up the `app.config` property to be a `cfg` instance.
// This eventually overrides the built-in nconf instance setup by
// broadway.
plugin.attach = function() {
  var app = this;
  this.config = cfg.createConfig().set(config);
  this.config.__proto__.configure = this.config.__proto__.env;

  // hoist up any method from config instance to the `app` object directly
  Object.keys(this.config.__proto__).forEach(function(proto) {
    if(app[proto] || typeof app.config[proto] !== 'function') return;
    app[proto] = app.config[proto].bind(app.config);
  });

  // setup defaults values as top-level prop
  app.config.set(config.defaults);
};
