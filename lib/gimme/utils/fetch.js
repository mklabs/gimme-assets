
var fs = require('fs'),
  util = require('util'),
  path = require('path'),
  events = require('events'),
  parse = require('url').parse,
  npm = require('npm'),
  join = path.join;


module.exports = fetch;

// **fetch** main handler.
function fetch(url, o, cb) {
  if(!cb) cb = o, o = {};
  var app = this;
  var nb = new NpmBuddy(o, app.get());

  nb.on('ready', function() {
    nb.cache(url);
  });

  nb.on('install', cb).on('error', cb);
}



// npm buddy!
function NpmBuddy(o, config) {
  var self = this;
  events.EventEmitter.call(this);
  this.options = config || {};
  this.pkg = o || {};

  // shorthen commands from npm to `this.npm`
  this.npm = npm.commands;

  // prefix where npm will install things
  this.where = this.options.prefix;

  npm.load(this.options, function(e) {
    if(e) self.emit(e);
    self.emit('ready');
  });
}

util.inherits(NpmBuddy, events.EventEmitter);

// **defaults** sets up default package.json data case there is not
NpmBuddy.prototype.defaults = function(url) {
  url = url || '';
  var p = parse(url),
    matched = this.match(p),
    user = matched[1],
    repo = matched[2];

  var pkg = this.pkg;
  return {
    name: pkg.name || repo,
    version: pkg.version || '0.0.0',
    description: pkg.description || "Automatically created by gimme's npm wrapper"
  };
};

// **match** returns information extracted from given `url`
NpmBuddy.prototype.match = function(url) {
  url = url.pathname || url;
  // /h5bp/html5-boilerplate/tarball/master
  var r = this._reg || (this._reg = /^\/?([^\/]+)\/([^\/]+)/);
  return url.match(r) || [];
};

// **cache** triggers after checking the cache is empty for given `url`
NpmBuddy.prototype.cache = function(url, cb) {
  cb = cb || this.callback('install');
  var self = this,
    data = this.defaults(url),
    path = join(this.options.prefix, 'node_modules', data.name),
    force = this.options.force;

  if(force) return this.install(url, cb);

  fs.stat(path, function(e) {
    if(!e) return cb();
    self.install(url, cb);
  });
};

// **install** uses npm to install given `url`
NpmBuddy.prototype.install = function(url, cb) {
  cb = cb || this.callback('install');
  var self = this,
    opts = this.options,
    install = this.npm.install,
    where = this.where;

  install(where, [url], function(e, deps, installed) {
    if(!e) return cb(null, installed, deps);
    var pkgpath = e.path;

    // let's check that we have no "Not Found" in package/index.js
    // in which case nodeload returns this
    self.checkIndex(path.dirname(pkgpath), function(e) {
      if(e) return cb(e);
      // create missing package.json file
      var pkg = self.defaults(url);
      self.createPkg(pkgpath, pkg, function(e) {
        if(e) return cb(e);
        // and retry, locally this time
        install(where, [path.dirname(pkgpath)], function(e, deps, installed) {
          if(e) return cb(e);
          var dirname = Object.keys(installed)[0];
          // cleanup
          self.cleanup(join(dirname, 'package.json'), function(e) {
            if(e) return cb(e);
            cb(null, installed, deps);
          });
        });
      });
    });
  });
};

// **checkIndex** checks and handles the case of index.js with
// "Not Found" in it.
NpmBuddy.prototype.checkIndex = function(dirname, cb) {
  var index = join(dirname, 'index.js');
  fs.readFile(index, 'utf8', function(e, body) {
    // no file, it's ok
    if(e) return cb();
    // Not found, definitely not ok
    if(/^Not\sFound/i.test(body)) return cb(new Error(body));
    cb();
  });
};

// **cleanup** given package `file`, filtering any prop startring with `_` or
// if `dist`
NpmBuddy.prototype.cleanup = function(file, cb) {
  fs.readFile(file, 'utf8', function(e, body) {
    var data = JSON.parse(body);
    data = Object.keys(data).map(function(key) {
      return { name: key, val: data[key] }
    }).filter(function(o) {
      return o.name !== 'dist' && !(/^_/).test(o.name);
    }).reduce(function(a, b) {
      a[b.name] = b.val;
      return a;
    }, {});
    fs.writeFile(file, JSON.stringify(data, null, 2), cb);
  });
};

// **callback** is the default callback handler.
NpmBuddy.prototype.callback = function(name) {
  var self = this;
  return function(e) {
    if(e) return self.emit('error', e);
    var args = Array.prototype.slice.call(arguments);
    self.emit.apply(self, [name].concat(args));
  }
};

// **createPkg** initializes a default package.json for tarballs
// that don't have one.
NpmBuddy.prototype.createPkg = function(path, data, cb) {
  if(!cb) cb = data, data = {};
  cb = cb || this.callback('package.json');
  if(!data.name) return cb(new Error('package.json: required name property'));
  if(!data.version) return cb(new Error('package.json: required version property'));
  fs.writeFile(path, JSON.stringify(data, null, 2), cb);
};
