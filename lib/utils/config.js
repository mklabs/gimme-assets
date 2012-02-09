
// nopt defaults config, types and shorthands


var config = exports,
  path = require('path'),
  nopt = require('nopt'),
  env = process.env,
  win32 = process.platform === 'win32',
  home = win32 ? env.USERPROFILE : env.HOME;

// may ends up attached directly on config
config.defaults = {
  home: home,
  prefix: path.resolve(home, '.gimme'),
  windows: win32,
  win32: win32,
  lr: win32 ? '\r\n' : '\n'
};

config.types = {
  loglevel: ["silent","win","error","warn","info","verbose","silly"],
  output: String,
  help: Boolean,
  version: Boolean,
  debug: Boolean
};

config.shorthands = {
  d: ['--debug'],
  o: ['--output']
};
