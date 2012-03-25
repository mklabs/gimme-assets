
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
  props: ['name', 'description', 'version', 'homepage', 'keywords', 'repo', 'branch', 'source', 'repositories'],
  viewer: 'markdown',
  bundle: false,
  nocompress: false
};

config.types = {
  loglevel: ['error', 'warn', 'info', 'log', 'debug'],
  output: String,
  version: Boolean,
  debug: Boolean,
  limit: Number,
  template: String,
  help: Boolean,
  props: [String, Array],
  usage: Boolean,
  viewer: ['man', 'browser', 'markdown'],
  bundle: Boolean,
  url: Boolean,
  copy: Boolean
};

config.descriptions = {
  loglevel    : 'What level of log to report',
  output      : 'Output directory, defaults to ./js/libs',
  version     : 'Output program version',
  help        : 'Display help information',
  usage       : 'Display usage for given subcommand',
  debug       : 'Slighly more verbose error output when set to true, defaults false',
  limit       : 'Maximum number of results to output with paginated list',
  props       : 'Optional list of package properties to output with list',
  viewer      : 'The program to use to view help content, if `markdown` then output to stdout',
  bundle      : 'When turned on, list will only display added bundles with `gimme add`',
  url         : 'When turned on, html command will output url without surrounding <script>',
  copy        : 'When turned on, html command will pipe the output to pbocpy instead of stdout',
  nocompress  : 'Disable minification for js files with `bundle` command',
  template    : 'Used with `create` command to override the template prompt'
};

config.shorthands = {
  d         : ['--debug'],
  o         : ['--output'],
  l         : ['--loglevel'],
  h         : ['--help'],
  v         : ['--version'],
  ll        : ['--limit'],
  clipboard : ['--copy'],
  pbcopy    : ['--copy'],
  t         : ['--template']
};

// short name for common things
config.aliases = {
  ls : 'list',
  ll : 'ls',
  la : 'ls'
};

// **attach** sets up the `app.config` property to be a `cfg` instance.
// This eventually overrides the built-in nconf instance setup by
// broadway.
plugin.attach = function(opts) {
  var app = this,
    merged = {};

  // merge config
  this.utile.mixin(merged, config);

  // merge pass in options
  this.utile.mixin(merged, opts);

  this.config = cfg.createConfig().set(merged);
  this.config.__proto__.configure = this.config.__proto__.env;

  // hoist up any method from config instance to the `app` object directly
  Object.keys(this.config.__proto__).forEach(function(proto) {
    if(app[proto] || typeof app.config[proto] !== 'function') return;
    app[proto] = function() {
      var get = proto === 'get',
        res = app.config[proto].apply(app.config, arguments);
      return get ? res : app;
    };
  });

  // setup defaults values as top-level prop
  app.config.set(config.defaults);
};
