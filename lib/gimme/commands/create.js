
var fs = require('fs'),
  path = require('path'),
  join = path.join,
  util = require('util'),
  glob = require('glob'),
  stream = require('stream'),
  child = require('child_process'),
  spawn = child.spawn,
  fork = child.fork,
  _ = require('underscore');

// mustache like interpolation
_.templateSettings = { interpolate : /\{\{(.+?)\}\}/g };

module.exports = create;

create.usage = [
  'gimme create',
  'gimme create --template <name>',
  'gimme create --template ./path/to/template'
].join('\n');

create.description = ['create', 'Creates a new project using optional `--template`'];
create.options = ['--template', '--help'];

create.props = [{
  message: 'Please enter a name',
  name: 'name',
  empty: false
}, {
  name: 'description'
}];


create.complete = function(o, cb) {
  var last = o.last;
  if(/^--?\w?/.test(last)) return cb(null, create.options);
};

function create(opts, cb) {
  var app = this,
    args = app.argv.remain.slice(1);

  var steps = [prompts, run, handle, done];

  // resolve first positional args as template, if no `--template`
  // defined
  if(!opts.template && args.length) opts.template = args[0], app.set('template', args[0]);

  app.set('templateDir', join(app.get('prefix'), 'templates', opts.template));

  (function step(fn) {
    if(!fn) return cb();
    var handle = fn.bind(app);
    handle(function(e) {
      if(e) return cb(e);
      step(steps.shift());
    });
  })(steps.shift());
}

function prompts(cb) {
  var app = this,
    data = app.get('data'),
    dir = join(app.get('prefix'), 'templates');

  var templatePrompt = { message: 'Please choose a template name', name: 'template'};
  app.prompt.override = app.config.get();
  app.prompt.get(templatePrompt, function(e, results) {
    if(e) return cb(e);
    var data = app.get('data') || results,
      pkg = join(dir, results.template, 'package.json');

    fs.readFile(pkg, 'utf8', function(e, body) {
      if(e) return cb(new Error('Invalid template name, ' + pkg + ' does not exist'));
      var json = JSON.parse(body);
      var props = create.props.map(function(prop) {
        if(json[prop.name]) prop.default = json[prop.name];
        return prop;
      });

      // add packages prompts if there are
      var gimmePrompts = (json.gimme && json.gimme.prompts) || [];
      props = props.concat(Object.keys(gimmePrompts).map(function(key) {
        return {
          name: key,
          message: gimmePrompts[key]
        }
      }));

      app.prompt.get(props, function(e, results) {
        if(e) return cb(e);
        app.util.mixin(json, results);
        app 
          .set('data', json)
          .set('template', path.dirname(pkg));
        cb();
      });
    });
  });
}

function run(cb) {
  var app = this,
    template = require(app.get('template'));

  template = createTemplate.call(app, template, app.get('data'));
  app.set('template', template);

  // init step
  template.init(app, cb);
}

function handle(cb) {
  var app = this,
    data = app.get('data');

  app.get('template').handle(data, cb);
}

function done(cb) {
  var app = this;
  cb();
}

// template creation
var proto = {};

proto.spawn = function(args, o, cb) {
  var self = this;
  if(!cb) cb = o, o = {};
  if(!cb) cb = function(e) {
    if(e) return self.emit('error', e);
    self.emit('spawn');
  };

  args = Array.isArray(args) ? args : args.split(' ');

  // take over by default, until we fork instead
  o.customFds = [0, 1, 2];

  var cmd = args.shift(),
    pr = spawn(cmd, args, o);

  pr
    .on('error', cb)
    .on('exit', cb);

  return pr;
};


proto.copyFiles = function(data, cb) {
  var app = this.app,
    dir = app.get('templateDir'),
    base = app.get('base') || app.get('dir') || process.cwd();

  if(!cb) cb = data, data = {};
  var files =  (data.gimme && data.gimme.files) || ['**/*'];
  files = Array.isArray(files) ? files : [files];
  files = files.map(function(file) {
    return glob.sync(file, { cwd: dir });
  });
  files = files.reduce(function(a, b) {
    return a.concat(b);
  }, []);
  files = files.filter(function(file) {
    return fs.statSync(join(dir, file)).isFile();
  });

  // copy, templatize and procss
  var ln = files.length;
  files.forEach(function(file) {
    console.log('>> file', file);
    var output = join(base, data.name, file);
    app.util.mkdirp(path.dirname(output), function(e) {
      if(e) return cb(e);
      var rs = fs.createReadStream(join(dir, file)),
        ws = fs.createWriteStream(output);

      rs.on('end', function(e) {
        if(e) return cb(e);
        fs.readFile(output, 'utf8', function(e, body) {
          if(e) return cb(e);
          var template = _.template(body);
          fs.writeFile(output, template(data), function(e) {
            if(e) return cb(e);
            if(--ln) return;
            console.log('done');
          });
        });
      });

      rs.pipe(ws);
    });
  });
};


function createTemplate(o, options) {
  var F = function DefaultTemplate() {
    this.writable = this.readable = true;
    stream.Stream.call(this);
  };
  util.inherits(F, stream.Stream);
  this.util.mixin(F.prototype, proto);
  this.util.mixin(F.prototype, o);
  return new F(options);
}

