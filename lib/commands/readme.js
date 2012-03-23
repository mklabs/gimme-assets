
var fs = require('fs'),
  url = require('url'),
  path = require('path'),
  child = require('child_process'),
  gh = require('../fetch'),
  Ronn = require('ronn').Ronn,
  ghm = require('github-flavored-markdown'),
  gimme = require('../..'),
  log = gimme.log,
  config = gimme.config,
  commands = gimme.commands,
  prefix = config.defaults.prefix;

module.exports = readme;

readme.usage = "gimme readme <pkgname>";
readme.description = ['readme <name>', "Show the appropriate documentation manpage generated from readme file"];

readme.complete = function (o, cb) {
  gimme.load(function() {
    cb(null, commands.list.packages('name'));
  });
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

  repohome = repohome.replace(/\.git$/, '').replace(/\/$/, '');

  if(!repohome) {
    log.warn(lib, 'has no repositories or not matching a git one');
    log.warn(pkg);
    return cb('Unable to guess likely documentation of ' + lib);
  }

  var userrepo = repohome.split('/').slice(-2).join('/');
  log.info('Searching for', lib, '\'s readme');

  return gh.glob([userrepo, '*.md', '*.markdown', '*.mkd', 'README', 'readme', '*.txt'], {}, function(err, files) {
    if(err) return cb(err);
    // reduce files to a single one, the first one that match our requirements
    var file = files.filter(function(f) { return (/^readme/i).test(f); })[0];
    log.log('readme', file);
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
  if(config.defaults.windows) return open(filepath, pkg, cb);

  var body = fs.readFileSync(filepath, 'utf8'),
    output = new Ronn(prepareMd(body, pkg)).roff(),
    tmp = path.join(prefix, "tmp.man");

  fs.writeFile(tmp, output, function(err) {
    if(err) return cb(err);
    log.debug('Written ', tmp);
    log.debug('Spawning ', tmp);
    child.spawn('man', [tmp], { customFds: [0, 1, 2] }).on('exit', cb);
  });
}

function prepareMd(body, pkg) {
  var front = [
    pkg.name + "-readme(3) -- " + pkg.name + "'s readme",
    "==========================================================================================================",
    "",
    " --- "
  ].join('\n');

  return front + body;
}

// win fallback, opening html markdown instead of spawning man
function open(filepath, pkg, cb) {
  log.info('Opening readme as HTML in default browser...');
  fs.readFile(path.join(__dirname, '../utils/layout.markdown.html'), 'utf8', function(err, layout) {
    if(err) return cb(err);
    fs.readFile(filepath, 'utf8', function(err, body) {
      if(err) return cb(err);
      var html = ghm.parse(body).replace(/<br\s?\/?>/g, ''),
        htmlPath = filepath.replace(path.extname(filepath), '.html');

      // Manual replacing of any placeholder value, following mustache syntax.
      // not worth adding a new template engine dependency for this single need.
      layout = layout.replace(/\{\{\{\s?body\s?\}\}\}/, html)
        .replace(/\{\{\s?title\s?\}\}/, pkg.name)
        .replace(/\{\{\s?description\s?\}\}/, pkg.description);

      fs.writeFile(htmlPath, layout, function(err) {
        if(err) return cb(err);
        return child.exec('explorer ' + htmlPath, function() { cb(); });
      });
    });
  });
}
