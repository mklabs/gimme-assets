
var fs = require('fs'),
  join = require('path').join;


module.exports = add;

add.usage = 'gimme add';
add.description = ['add', 'Add a new bundle definition'];

add.complete= function(o, cb) {

  var last = o.last;

  // options complete
  var props = app.get('props').map(function(p) { return '--' + p; });
  if(/^--?\w?/.test(last)) return cb(null, props);

};

add.properties = [{
  message: 'Please enter a name',
  name: 'name',
  empty: false
}, {
  name: 'description'
}, {
  message: 'Please enter the source repository on github, in the form of user/repository',
  name: 'repo',
  validator: /([^\/]+)\/([^\/]+)/
}, {
  message: 'The source files in the repository, can be a space-separated list of glob patterns',
  name: 'source'
}, {
  message: 'Output directory, files will get installed here',
  name: 'dir',
  default: './js/libs'
}];

function add(opts, cb) {
  var app = this;

  // may be done at cli-plugin level
  app.prompt.override = opts;
  app.prompt.get(add.properties, function(err, data) {
    if(err) return cb(err);
    handle.call(app, data, cb);
  });
}


function handle(o, cb) {
  var app = this,
    list = app.commands.list;

  // deal with defaults
  o = o || {};
  if(!o.name) return cb(new Error('required name missing'));
  if(!o.repo) return cb(new Error('required repo missing'));
  if(!o.source) return cb(new Error('required source missing'));
  // lazy flag to differentiate from normal libs
  o.custom = true;

  var source = o.source = Array.isArray(o.source) ? o.source : o.source.split(' ');

  // update handler
  var update = updateBundles.bind(app);

  // get the bundle.json file
  var packages = list.packages(false, app.get('prefix'), 'bundle.json');

  // check if we have a bundle named the same
  var previous = packages.filter(function(p) {
    return p.name === o.name;
  })[0];

  // update bundle file
  if(!previous) return update(o, packages.concat(o), cb);

  // already exists, confirm override
  var msg = o.name + ' already exists.';
  app.warn(msg);

  // unless force was turned on
  if(app.get('force')) return update(o, packages.concat(o), cb);
  app.prompt.get({ message: 'Override? [Y]es, [N]o', name: 'answer', validator: /^[yn]$/i, default: 'n' }, function(err, data) {
    if(err) return cb(err);
    var ok = /y/i.test(data.answer);
    app.info('Are you sure?', data.answer, ok);
    if(!ok) return cb();

    // update bundles
    packages = packages.map(function(pkg) {
      return pkg.name === o.name ? o : pkg;
    });

    update(o, packages, cb);
  });
}

function updateBundles(pkg, packages, cb) {
  var app = this,
    bundle = join(app.get('prefix'), 'bundle.json');

  fs.writeFile(bundle, JSON.stringify(packages, null, 2), function(err) {
    if(err) return cb(err);
    app.info(pkg.name, 'was added successfully to bundle.json file').info(pkg);
    cb();
  });
}

