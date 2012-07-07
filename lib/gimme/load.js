
var fs = require('fs'),
  path = require('path'),
  join = path.join,
  url = require('url'),
  vm = require('vm'),
  fetch = require('./fetch');

var plugin = module.exports;

plugin.attach = function() {
  this.load = load;
};

plugin.init = function(cb) {
  var app = this,
    bundle = app.bundle = join(app.get('prefix'), 'bundle.json'),
    step = 2;

  app.utile.mkdirp(app.get('prefix'), function(e) {
    if(e) return cb(e);
    // trigger the loading stuff, getting necessary dictionnaries
    // for cdnjs / microjs
    app.load(next);
    // create the bundle.json file if it does not exists yet
    fs.stat(bundle, function(e) {
      if(!e) return next();
      // expected err, create file
      fs.writeFile(bundle, JSON.stringify([]), next);
    });
  });

  function next(e) {
    if(e) return cb(e);
    if(--step) return;
    cb(e);
  }
};

// cdnjs / microjs packages installer
//
// Ensures that both `~/.gimme/packages.json` and `~/.gimme/data.js` are here.
//
// Only fetch from remote if the file isnn't already there, may force the
// update if force param is passed in.
//

function load(force, cb) {
  if(!cb) cb = force, force = false;
  var done = {};
    app = this,
    config = app.get();

  var packages = path.join(app.get('prefix'), 'cdnjs'),
    datajs = path.join(app.get('prefix'), 'microjs'),
    dictionnary = path.join(app.get('prefix'), 'gimme.json');

  if(fs.existsSync(dictionnary)) return cb();

  app.log.info('Fetching cdnjs and microjs packages dictionnary.');
  fetch.github('cdnjs', 'website', 'gh-pages', packages, next('cdnjs'));
  fetch.github('madrobby', 'microjs.com', 'master', datajs, function(e) {
    if(e) return cb(e);

    var datajson = path.join(datajs, 'data.json');

    // only go further if data.json does not exist
    fs.stat(datajson, function(e) {
      if(!e && !force) return next('microjs')();

      // data.js is JavaScript, run in a new context, taking the result.
      // building the data.json according file
      fs.readFile(path.join(datajs, 'data.js'), 'utf8', function(e, body) {
        if(e) return cb(e);
        var sandbox = {};
        vm.runInNewContext(body, sandbox);
        fs.writeFile(datajson, JSON.stringify(sandbox.MicroJS, null, 2), function(e) {
          if(e) return cb(e);
          next('microjs')();
        });
      });
    });
  });


  function next(from) { return function (err) {
    if(err) return cb(err);
    done[from] = true;
    if(!done.cdnjs || !done.microjs) return;

    fs.stat(dictionnary, function(err) {
      if(!err && !force) return cb();
      var cdnjs, microjs;
      fs.readFile(path.join(packages, 'packages.json'), 'utf8', function(err, body) {
        if(err) return cb(err);
        cdnjs = JSON.parse(body);
        if(cdnjs && microjs) merge(cdnjs.packages, microjs, app, cb);
      });

      fs.readFile(path.join(datajs, 'data.json'), 'utf8', function(err, body) {
        if(err) return cb(err);
        microjs = JSON.parse(body);
        if(cdnjs && microjs) merge(cdnjs.packages, microjs, app, cb);
      });
    });
  }}
};

// Merge the two, cdnjs libs takes precedence.
//
// sanitize pkg.names for both sources, lowercasing all, replacing
// spaces by `-`.
//
// Generates a single `gimme.json` file with following props:
//
//  - name: package's name, lowercased, spaces replaced by `-`
//  - description: package's description
//  - version: package's version, if provided (case of cdnjs only)
//  - homepage: package's homepage, for microjs this is the url prop
//  - keywords: package's keyword, case of microjs this is the tags prop
//  - repo: package's remote repository, format is user/repo
//  - branch: package's remote repo branch
//  - source: string or array of strings mapping the filepaths to fetch.
//    - in case of cdnjs, needs to be guessed from name/version/filename.
//
function merge(cdnjs, microjs, app, cb) {
  var pkgs = [];

  microjs = microjs.map(function(pkg) {
    pkg.name = sanitize(pkg.name);
    pkg.origin = 'microjs';
    return pkg;
  });

  // merge the two, cdnjs libs takes precedence
  var names = cdnjs.map(function(pkg) {
    pkg.origin = 'cdnjs';
    return sanitize(pkg.name);
  });

  microjs = microjs.filter(function(pkg) {
    // filter out any libs already present in cdnjs packages
    return !~names.indexOf(sanitize(pkg.name));
  });

  pkgs = pkgs.concat(cdnjs).concat(microjs);

  // now, try to standardize...
  pkgs = pkgs.map(function(pkg) {
    var o = {
      name: pkg.name,
      description: pkg.description,
      version: pkg.version || '',
      homepage: pkg.homepage || pkg.url || '',
      keywords: pkg.keywords || pkg.tags,
      repo: guess('repo', pkg),
      branch: guess('branch', pkg),
      source: guess('source', pkg),
      repositories: guess('repositories', pkg),
      origin: pkg.origin
    };
    o[pkg.origin] = true;
    return o;
  });

  // filter out any invalid packages, just testing pkg.name
  pkgs = pkgs.filter(function(pkg) { return pkg.name; });

  pkgs = pkgs.sort(function(a, b) {
    // todo: true sort
    return a.name < b.name;
  });

  fs.writeFile(path.join(app.get('prefix'), 'gimme.json'), JSON.stringify(pkgs, null, 2), cb);
}

// sanitize the pkg.name for both sources, lowercasing all, replacing
// blank spaces by -
function sanitize(name) {
  if(!name) return;
  return name.toLowerCase().replace(/\.js$/, '').replace(/\s/g, '-');
}

// guess things
function guess(what, from) {
  if(!guess[what]) return;
  return guess[what](from);
}

guess.repo = function repo(from) {
  if(!from.source) return 'cdnjs/cdnjs';
  var source = Array.isArray(from.source) ? from.source[0] : from.source;
  return (/raw\.github/).test(source) ?
    source.replace(/https?:\/\/raw\.github\.com\//, '').split('/').slice(0, 2).join('/') :
    source;
};

guess.branch = function branch(from) {
  if(!from.source) return 'master';
  var source = Array.isArray(from.source) ? from.source[0] : from.source;
  return source.replace(/https?:\/\/raw\.github\.com\//, '').split('/').slice(2)[0];
};

guess.repositories = function branch(from) {
  var repos = from.repositories ? from.repositories : [],
    source = Array.isArray(from.source) ? from.source : [from.source];

  if(!from.url && !from.homepage) return repos;

  repos = repos.length ? repos : [{
    type: 'git',
    url: from.url || from.homepage
  }];

  return repos;
};

guess.source = function source(from) {
  if(!from.source) {
    // cdnjs case
    return [from.filename];
  }

  var src = Array.isArray(from.source) ? from.source : [from.source];
  return src.map(function(s) {
    return s.replace(/https?:\/\/raw\.github\.com\//, '')
      .replace([guess('repo', from), guess('branch', from)].join('/'), '')
      .replace(/^\//, '');
  });
};
