
var fs = require('fs'),
  path = require('path'),
  exec = require('child_process').exec,
  console = require('../logger'),
  commands = require('../commands');

var prefix = path.join(process.env.HOME, '.gimme', 'ajax', 'libs');

module.exports = docs;

docs.open = open;

docs.usage = "gimme docs <pkgname>";
docs.description = ['docs <name>', "Tries to open package's documentation using default browser"];

docs.complete = function (o, cb) {
  cb(null, commands.list.packages('name'));
};

function docs (opts, cb) {
  var args = opts.argv.remain.slice(1);
  if (!args.length) return cb(docs.usage);
  if (args.length > 1) return cb('docs only work with a single package');

  var lib = args[0],
    pkg = commands.list.package(lib);

  if (!pkg) return cb('Unknown package: ' + lib);

  var home = pkg.homepage,
    repo = pkg.repositories && pkg.repositories[0],
    repohome = repo && repo.type === 'git' ? repo.url : '';

  repohome = repohome.replace(/^git(@|:\/\/)/, 'http://').replace(/\.git$/, '');

  if(!home && !repohome) return cb('Unable to guess likely documentation of ' + lib);
  open(home || repohome + '#readme', cb);
}

function open(url, cb) {

  // todo: configure this
  var browser = 'open';

  exec(browser + ' ' + url, function(err) {
    if(err) {
      console.warn([
        "Failed to open "+url+" in a browser.  It could be that the",
        "`browser` system command is invalid.",
        ""
      ].join('\n'));

      return cb(err);
    }

    cb();
  });
}
