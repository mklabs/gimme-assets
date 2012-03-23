
//
// Custom Flatiron CLI plugin.
//
// based of https://github.com/flatiron/flatiron/blob/master/lib/flatiron/plugins/cli.js
//

var fs = require('fs'),
  path = require('path'),
  nopt = require('nopt'),
  flatiron = require('flatiron'),
  director = require('director'),
  common = flatiron.common;

// will use a local module to hoist up any common utilities from
// flatiron, plus some custom
common.pad = function pad(str, ln) {
  var padding = ln - str.length;
  return padding > 0 ? str + new Array(padding).join(' ') : str;
};

var cli = module.exports;

// plugin name definition
cli.name = 'cli';

//
// **attach** initializes `this` (the application) along an optional
// `options` Hash object with the core `cli` plugins consisting of:
// `argv`, 'prompt', `command` in that order.
//
// `options` may define the following properties: `usage`, `source`,
// `argv`, `version`, and `prompt`.
//
cli.attach = function attach(options) {
  var app = this;
  options = options || {};

  // Setup nopt with default options
  cli.nopt.call(this, options.nopt);

  // Setup `this.prompt`.
  cli.prompt.call(this, options.prompt);

  // override broadway's bootstraper function
  app.bootstrapper.bootstrap= function() {};
  app.bootstrapper.init = function(app, cb) {
    cb();
  };

  // Setup `app.router` and associated core routing method.
  app.cli    = {}
  app.router = new director.cli.Router().configure({
    async: true
  });

  app.start = function (options, callback) {
    if (!callback && typeof options === 'function') {
      callback = options;
      options = {};
    }

    callback = callback || function (err) {
      if(!err) return;
      err.message = 'Error executing ' + app.argv.remain.join(' ') + app.get('lr') + err.message;
      app.error(app.get('debug') ? err.stack : err.message);
    };

    app.init(options, function (err) {
      if (err) return callback(err);
      app.running = app.argv.remain[0];
      app.router.dispatch('on', app.argv.remain.join(' '), app.log, callback);
    });
  };

  app.cmd = function (path, handler) {
    app.router.on(path, handler);
  };

  cli.commands.call(this, options);
};

//
// **init** initializes this plugin by setting what needs to be settled.
//
cli.init = function (done) {
  var app = this;
  done();
};

//
// **nopt** setups up `app.argv` using nopt and the specified options,
// which is an Array of nopt arguments, `types`, `shorthands`,
// `process.argv` and the slice index `2`.
//
cli.nopt = function (options) {
  var app = this;
  this.nopt = this.opts = nopt.apply(this, options);
  this.argv = this.nopt.argv;

  if(this.config) {
    Object.keys(this.nopt).forEach(function(key) {
      if(key !== 'argv') app.config.set(key, app.nopt[key]);
    });
  }
};

//
// **commands** configures the `app.commands` object which is
// lazy-loaded from disk along with some default logic for: `help` and
// `alias`.
//
cli.commands = function (options) {
  var app = this;

  // app name, used for help output prefixing
  var name = app.name || app.config.get('name') || '';

  // Setup any pass-thru options to the application instance
  app.usage = options.usage;
  var dir = app.cli.source = options.dir || options.source;
  app.commands = app.commands || {};

  // handle dir command source(s)
  dir = Array.isArray(dir) ? dir : [dir];
  dir.forEach(cli.loadCommand.bind(app));

  // register each command to their respective route
  Object.keys(app.commands).forEach(function(cmd) {
    app.cmd(new RegExp(cmd + '\\s?(.+)?'), function(args, cb) {
      if(args) args = args.split(' ');
      try {
        app.commands[cmd].call(app, app.nopt, cb);
      } catch(e) {
        cb(e);
      }
    });
  });

  // Setup default help command
  app.cmd(/help ([^\s]+)?\s?([^\s]+)?/, app.showHelp = function showHelp(command, subcommand, cb) {
    if(!cb) cb = subcommand, subcommand = '';
    if(!cb) cb = command, command = '';

    app.running = 'help';

    var lr = app.config.get('defaults').lr,
      usage = app.usage.join(lr);

    usage = usage.replace('$commands', function() {
      var cmds = app.commands,
        keys = Object.keys(cmds);

      var out = keys.filter(function(command) {
        return cmds[command].description;
      }).map(function(command) {
        command = cmds[command].description;
        return ' ' + name + ' ' + common.pad(command[0], 25) + command[1];
      });

      return out.join(lr)
    });

    usage = usage.replace('$options', function() {
      var types = Object.keys(app.config.get('types')),
        desc = app.config.get('descriptions'),
        sh = app.config.get('shorthands');

      var out = types.map(function(type) {
        var short = Object.keys(sh).filter(function(key) {
          return sh[key].filter(function(val) {
            return !!~val.indexOf(type);
          }).length;
        })[0];

        short = short ? '-' + short + ', ': '';

        var name = short + '--' + type;

        return ' ' + common.pad(name, 25) + ' ' + (desc[type] || '');
      });

      return out.join(lr);
    });

    console.log(usage);
    cb();
  });


  app.cmd('help', app.showHelp);
  app.router.notfound = app.showHelp;
};


//
// **loadCommand** takes care of setting up commands as lazy-loaded
// requires.
//
cli.loadCommand = function (dir) {
  var app = this;

  if(!path.existsSync(dir)) return;

  var files = fs.readdirSync(dir)
    .map(function(file) {
      return path.resolve(dir, file);
    })
    .filter(function(file) {
      return fs.statSync(file).isFile();
    });

  files.forEach(function(file) {
    var name = path.basename(file).replace(path.extname(file), '');
    app.commands.__defineGetter__(name, function() {
      return require(file);
    });
  });
};

//
// **prompt** Sets up the application `prompt` property to be lazy
// requires on top of the `prompt` module.
//
cli.prompt = function (options) {
  options = options || {};

  this.__defineGetter__('prompt', function () {
    if (!this._prompt) {
      // Pass-thru any prompt specific options that are supplied.
      var prompt = require('prompt'),
          self = this;

      prompt.allowEmpty = options.allowEmpty || prompt.allowEmpty;
      prompt.message    = options.message    || prompt.message;
      prompt.delimiter  = options.delimiter  || prompt.delimiter;
      prompt.properties = options.properties || prompt.properties;

      // Setup `destroy` property for destructive commands
      prompt.properties.destroy = {
        name: 'destroy',
        message: 'This operation cannot be undone, Would you like to proceed?',
        default: 'yes'
      };

      // Hoist up any prompt specific events and re-emit them as
      // `prompt::*` events.
      ['start', 'pause', 'resume', 'prompt', 'invalid'].forEach(function (ev) {
        prompt.on(ev, function () {
          var args = Array.prototype.slice.call(arguments);
          self.emit.apply(self, [['prompt', ev]].concat(args));
        });
      });

      // Extend `this` (the application) with prompt functionality
      // and open `stdin`.
      this._prompt = prompt;
      this._prompt.start().pause();
    }

    return this._prompt;
  });
};