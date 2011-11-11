
// todo: cache system for readmes fetch, probably just downloading master
// tarball.

var child = require('child_process'),
  path = require('path'),
  fs = require('fs'),
  url = require('url'),
  npm = require('npm'),
  request = require('request'),
  Ronn = require('ronn').Ronn,
  console = require('../logger'),
  commands = require('../commands'),
  prefix = path.join(process.env.HOME, '.gimme-assets'),
  prefixLibs = path.join(prefix, 'cdnjs', 'ajax', 'libs'),
  prefixMans = path.join(prefix, 'mans'),
  exec = child.exec,
  spawn = child.spawn;

module.exports = readme;

readme.usage = "gimme readme <pkgname>";
readme.description = ['readme <name>', "guess at the likely location of a package's readme, and then tries to generate a manpage using ronnjs"];

readme.complete = function (o, cb) {
  cb(null, commands.list.readdirSync());
};

function readme (opts, cb) {
  var args = opts.argv.remain.slice(1);
  if (!args.length) return cb(readme.usage);

  var n = args[0].split("@").shift(),
    file = path.join(prefixLibs, n, 'package.json');

  console.info('Searching for', n, '\'s readme');
  return path.exists(file, function(exists) {
    if(!exists) {
      console.warn('Unknown package', n);
      return cb();
    }

    fs.readFile(file, 'utf8', function(err, content) {
      var pkg = JSON.parse(content),
        repo = pkg.repository || pkg.repositories;

      if(!repo) {
        console.error(pkg);
        return cb(new Error('Unable to parse repository from ' + pkg.name + '\'s package.json'));
      }
      if(Array.isArray(repo)) repo = repo.shift();
      if (repo.url) repo = repo.url;

      console.debug('Repository for ', pkg.name, ':', repo);

      return man(repo, pkg, cb);
    });
  });
}

function man(repo, pkg, cb) {
  var parsed = url.parse(repo.replace(/\.git$/, '')),
    raw = url.format({
      protocol: parsed.protocol,
      host: 'raw.' + parsed.host,
      pathname: path.join(parsed.pathname, '/master/')
    }),
    nodeload = url.format({
      protocol: parsed.protocol,
      host: 'nodeload.' + parsed.host,
      pathname: path.join(parsed.pathname, '/tarbal/master')
    });

  var ext = ['.md', '.markdown', '.txt', ''];

  var readmes = ext.map(function(ext) {
    return 'readme' + ext;
  });

  readmes = ext
    .map(function(ext) { 
      return 'readme' + ext;
    })
    .concat(ext.map(function(ext) { 
      return 'README' + ext; 
    }));

  console.debug('Loading readmes from', {
    repo: repo,
    readmes: readmes
  });

  get(raw, readmes, function(err, body) {
    if(err) return cb(err);

    var output = new Ronn(prepareMd(body, pkg)).roff(),
      tmp = path.join(prefix, "tmp.man");

    fs.writeFile(tmp, output, function(err) {
      if(err) return cb(err);
      console.debug('Written ', tmp);
      console.debug('Spawning ', tmp);
      var ch = spawn('man', [tmp], {
        customFds: [0, 1, 2]
      });
      ch.on('exit', cb);
    });
  });
}

function prepareMd(body, pkg) {
  var front = [
    pkg.name + "-readme(3) -- " + pkg.name + "'s readme",
    "==========================================================================================================",
    "",
    ""
  ].join('\n');

  return front + body;
}

function get(repo, readmes, cb) {
  var readme = readmes.shift();
  if(!readme) return cb(new Error('Unable to load readme from ' + repo));

  var mancache = path.join(prefixMans, repo.replace(/^https:\/\/raw\.github\.com/, ''), 'readme.md');

  return cache(mancache, function(err, body) {
    if(err) return cb(err);
    if(body) {
      console.debug('Loading from cache', mancache);
      return cb(null, body);
    }

    var url = /svnroot/.test(repo) ? repo.replace(/master\/?$/, 'trunk/') : repo;

    console.info('Not cached yet, loading from', url + readme);
    return request(url + readme, function(err, response, body) {
      if(err) return cb(err);
      if(response.statusCode !== 200) {
        console.warn('Status:', response.statusCode, '. Trying to load from remaining readmes:');
        return get(repo, readmes, cb);
      }

      fs.writeFile(mancache, body, function(err) {
        if(err) return cb(err);
        cb(null, body);
      });
    });
  });
}

function mkdirp(path, cb) {
  exec('mkdir -p ' + path, cb);
}

function cache(readme, cb) {
  if(!cache.store) cache.store = {};
  if(cache.store[readme]) return cb(null, cache.store[readme]);
  return mkdirp(path.dirname(readme), function(err) {
    if(err) return cb(err);

    return path.exists(readme, function(exists) {
      if(!exists) return cb();

      return fs.readFile(readme, function(err, body) {
        if(err) return cb(err);

        cache.store[readme] = body;
        cb(null, body);
      });
    });

  });
}
