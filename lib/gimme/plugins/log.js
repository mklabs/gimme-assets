
// A basic drop-in replacement for `console`, based and inspired by
// [LearnBoost/socket.io logger](https://raw.github.com/LearnBoost/socket.io/master/lib/logger.js).
//
// Exports a single instance of `Logger`, with default options.

var util = require('util');

var logger = module.exports;

// plugin definition
logger.name = 'logger';

logger.attach = function(options) {
  var app = this;
  this.log = new Logger(options);

  // hoist up any "level" method from logger instance to the `app`
  // object directly for conveniency
  app.out = app.log.out.bind(app.log);
  levels.forEach(function(proto) {
    if(app[proto]) return;
    app[proto] = app.log[proto].bind(app);
  });

  // add a special inspect method on app, to log and display
  // app.config if defined, otherwise noop.
  app.inspect = function(key, lvl) {
    lvl = lvl || 'info';
    this.config && app[lvl](this.config.get(key));
  };
}

// log levels
var levels = [
  'error',
  'warn',
  'info',
  'log',
  'debug'
];

// mapping colors for levels
var colors = [
  31,
  33,
  32,
  36,
  90
];

// Logger object
function Logger(opts) {
  opts = opts || {};
  this.colors = opts.colors || true;
  this.level(opts.loglevel || opts.level || 4);
  this.enabled = true;
};


// **level** get/set the loglevel to report. When no arg is provided,
// then it acts as a getter. When an argument is provided, which can be
// a String (one of `debug` to `error`) or a Integer (`0` to `4`)
Logger.prototype.level = function(val) {
  if(!val) return this._level;
  this._level = typeof val === 'string' ? levels.indexOf(val) : val;
};

Logger.prototype.out = function(type) {
  var index = levels.indexOf(type),
    prefix = this.colors ? '   \033[' + colors[index] + 'm' + pad(type) + ' -\033[39m' : type + ':',
    args = toArray(arguments);

  if (index > this._level || !this.enabled)
    return this;

  args = args.map(function(arg) {
    if(Array.isArray(arg)) return arg;
    return typeof arg === 'object' ? inspect(arg, prefix) : arg;
  });

  console.log.apply(console, [prefix].concat(args.slice(1)));

  return this;
};

Logger.prototype.write = function write() {
  var args = Array.prototype.slice.call(arguments);
  process.stdout.write.apply(process.stdout, args);
};

levels.forEach(function(name) {
  Logger.prototype[name] = function () {
    this.out.apply(this, [name].concat(toArray(arguments)));
    return this;
  };
});


// ## helpers
function pad(str) {
  var max = 0;

  for (var i = 0, l = levels.length; i < l; i++)
    max = Math.max(max, levels[i].length);

  if (str.length < max)
    return str + new Array(max - str.length + 1).join(' ');

  return str;
}

function toArray(o) {
  return Array.prototype.slice.call(o);
}


function inspect(data, prefix) {
  return ('\n' + util.inspect(data, false, 4, true) + '\n').split('\n').map(function(line) {
    return !!line ? prefix + line : line;
  }).join('\n');
}
