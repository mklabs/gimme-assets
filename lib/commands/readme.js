
var fs = require('fs'),
  path = require('path'),
  url = require('url'),
  gh = require('gh-fetch'),
  Ronn = require('ronn').Ronn,
  spawn = require('child_process').spawn,
  console = require('../logger'),
  commands = require('../commands');

var prefix = path.join(process.env.HOME, '.gimme');

module.exports = readme;

readme.usage = "gimme readme <pkgname>";
readme.description = ['readme <name>', "Show the appropriate documentation manpage generated from readme file"];

readme.complete = function (o, cb) {
  cb(null, commands.list.packages('name'));
};

function readme (opts, cb) {
  var args = opts.argv.remain.slice(1);
  if (!args.length) return cb(readme.usage);
  if (args.length > 1) return cb('readme only work with a single package');

  var lib = args[0],
    pkg = commands.list.package(lib);

  if (!pkg) return cb('Unknown package: ' + lib);

  var repo = pkg.repositories && pkg.repositories[0],
    repohome = repo && repo.type === 'git' ? repo.url : '';

  repohome = repohome.replace(/^git(@|:\/\/)/, 'http://').replace(/\.git$/, '').replace(/:/g, '/');
  if(!repohome) {
    console.warn(lib, 'has no repositories or not matching a git one');
    console.warn(pkg);
    return cb('Unable to guess likely documentation of ' + lib);
  }

  var userrepo = repohome.split('/').slice(-2).join('/');
  console.info('Searching for', lib, '\'s readme');

  return gh.glob([userrepo, '*.md', '*.markdown', '*.mkd', 'README', 'readme', '*.txt'], {}, function(err, urls, files) {
    if(err) return cb(err);
    // reduce files to a single one, the first one that match our requirements
    var file = files.filter(function(f) { console.log(f); return /^readme/i.test(f); })[0];
    console.log('readme', file);
    if(!file) return cb(new Error('Unable to guess correct readme file for ' + lib));

    var filepath = path.join(prefix, 'man', lib, file);
    fs.readFile(filepath, function(err) {
      if(!err) return man(filepath, pkg, cb);

      gh.fetch([userrepo, file], { whereto: path.join(prefix, 'man', lib) }, function(err) {
        if(err) return cb(err);
        man(filepath, pkg, cb);
      });
    });
  });
}

function man(filepath, pkg, cb) {
  var body = fs.readFileSync(filepath, 'utf8'),
    output = new Ronn(prepareMd(body, pkg)).roff(),
    tmp = path.join(prefix, "tmp.man");

  fs.writeFile(tmp, output, function(err) {
    if(err) return cb(err);
    console.debug('Written ', tmp);
    console.debug('Spawning ', tmp);
    spawn('man', [tmp], { customFds: [0, 1, 2] }).on('exit', cb);
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

