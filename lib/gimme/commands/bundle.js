
var fs = require('fs'),
  path = require('path'),
  join = path.join,
  util = require('util'),
  stream = require('stream'),
  spawn = require('child_process').spawn,
  uglifyjs = require('uglify-js'),
  fstream = require('fstream');

module.exports = bundle;

bundle.usage = 'gimme bundle <lib, ...>';
bundle.description = ['bundle', 'Concat and minifiy the given package(s) and local files'];
bundle.options = ['--nocompress', '--output', '--copy', '--clipboard', '--pbcopy', '--help'];

bundle.complete = function(o, cb) {
  var last = o.last;
  if(/^--?\w?/.test(last)) return cb(null, bundle.options);
  var libs = this.commands.list.packages('name', app.get('prefix'));
  cb(null, libs);
};

function bundle(opts, cb) {
  var app = this,
    libs = app.argv.remain.slice(1),
    list = app.commands.list,
    lr = app.get('lr');

  if(!libs.length) return app.info(bundle.usage);

  // destination output
  var ws = opts.output ? fs.createWriteStream(path.resolve(opts.output)).on('close', cb) :
      opts.copy ? spawn('pbcopy').stdin : process.stdout;

  // let's create a new BundleStream!
  var bundle = new BundleStream(app, libs, opts)
    .on('error', cb)
    .pipe(ws);
}

//
// BundleStream!
//
// Yet another fancy stream name.
//
function BundleStream(app, args, options) {
  var self = this;
  this.readable = true;
  stream.Stream.call(this);
  if(!app) return this.emit('error', new Error('an app object should be provided'));
  if(!args) return this.emit('error', new Error('an list of package and glob patterns should be provided'));

  options = options || {};
  this.app = app;
  this.args = args;
  this.states = {};
  this.assets = [];
  this.nocompress = options.nocompress;
  this.uglify = options.uglify || {};

  this.remaining = 0;

  // bundle object
  var bundle = this.bundle = {};
  this.on('libs', function() {
    self.states.libs = true;
  });
  this.on('files', function() {
    self.states.files = true;
  });

  this.libs(bundle);
  this.files(bundle);

  this.on('tick', function() {
    if(!self.states.libs || !self.states.files) return;
    self.stream();
    process.nextTick(function() {
      self.emit('end');
    });
  });
}

util.inherits(BundleStream, stream.Stream);

BundleStream.prototype.stream = function() {
  var sorted = [],
    args = this.args,
    self = this;

  // sort
  this.assets.forEach(function(asset) {
    var index = args.indexOf(asset.name);
    sorted[index] = (sorted[index] || []).concat(asset);
  });

  sorted.forEach(function(assets) {
    self.emit('data', '\n// ' + assets[0].name + '\n');
    assets.forEach(function(asset) {
      self.emit('data', asset.chunk);
    });
  });
};

BundleStream.prototype.files = function files(bundle, args) {
  var self = this;
  args = args || this.args;
  bundle = bundle || this.bundle;
  var files = bundle.files || (bundle.files = []);
  var matches = args.filter(function(arg) {
    return (/\//).test(arg);
  });

  this.remaining += matches.length;

  var ln = matches.length;
  if(!ln) return self.emit('files');
  matches.forEach(function(m) {
    self.readFile(m, path.resolve(m), function(e) {
      if(e) return self.emit('error', e);
      if(--ln) return;
      self.emit('files');
    });
  });
};

BundleStream.prototype.readFile = function(name, file, encoding, cb) {
  var self = this;
  if(!cb) cb = encoding, encoding = null;
  fs.readFile(file, encoding, cb);
};

BundleStream.prototype.libs = function libs(bundle, args) {
  var install = app.commands.install.bind(app),
    self = this;

  args = args || this.args;
  bundle = bundle || this.bundle;

  var libs = bundle.libs || (bundle.libs = []);
  var matches = args.filter(function(arg) {
    return !(/\//).test(arg);
  });

  this.remaining += matches.length;
  libs = libs.concat(matches);

  var opts = { argv: {} };
  opts.argv.remain = ['install'].concat(libs);
  opts.dry = true;

  var count = 0, ln = libs.length;
  app.on('install', function(pkg, abspath, destpath) {
    count++; ln--;
    self.readFile(pkg.name, abspath, function(e, chunk) {
      if(e) return self.emit('error', e);
      self.add({ name: pkg.name, filename: abspath, chunk: chunk });
      if((--count) || ln > 0) return;
      self.emit('libs');
      self.emit('tick');
    });
  });

  // should change command semantic to accept remain as first arg
  install(opts, function(e) {
    if(e) return self.emit('error', e);
  });
};

BundleStream.prototype.add = function add(o) {
  var bundle = this;
  o = Array.isArray(o) ? o : [o];
  o.forEach(function(asset) {
    var min = /min.js$/.test(asset.filename),
      js = path.extname(asset.filename) === '.js',
      minify = js && !min;

    asset.chunk = minify ? bundle.minify(asset) : asset.chunk;
    bundle.assets = bundle.assets.concat(asset);
    bundle.emit('tick');
  });
};

BundleStream.prototype.minify = function minify(asset) {
  if(this.nocompress) return asset.chunk;

  var pro = uglifyjs.uglify,
    parser = uglifyjs.parser,
    src = asset.chunk;

  src = Buffer.isBuffer(src) ? src.toString() : src;

  try {
    ast = parser.parse(src);
    ast = pro.ast_mangle(ast, this.uglify.mangle || {});
    ast = pro.ast_squeeze(ast, this.uglify.squeeze || {});
    src = pro.gen_code(ast, this.uglify.codegen || {});
  } catch(e) {
    e.message = e.message  + ' for ' + asset.name;
    this.emit('error', new Error(e));
  }

  return new Buffer(src);
};

