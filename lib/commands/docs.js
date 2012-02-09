
var fs = require('fs'),
  path = require('path'),
  exec = require('child_process').exec,
  gimme = require('../../'),
  log = gimme.log,
  config = gimme.config,
  commands = gimme.commands,
  prefix = config.defaults.prefix;

module.exports = docs;

docs.open = open;

docs.usage = "gimme docs <pkgname>";
docs.description = ['docs <name>', "Tries to open package's documentation using default browser"];

docs.complete = function (o, cb) {
  gimme.load(function() {
    cb(null, commands.list.packages('name'));
  });
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

  // todo: configure this, will only work as is with win32 or OSx.
  // Needs a little more logic to handle unixes.
  // Or.. just use the config.defaults.browser value, todo cli command
  // to manage config, ala npm.
  var browser = config.defaults.browser ? config.defaults.browser :
    config.defaults.windows ? 'explorer' : 'open';

  log.info('Opening HTML in default browser...');
  exec(browser + ' ' + url, function(err) {
    // > windows is SO weird...
    // getting an error with explore cmd on windows, even though everything went well
    if(browser === 'explorer') return cb();

    if(err) {
      log.warn([
        "Failed to open " + url + " in a browser.  It could be that the",
        "`browser` system command is invalid.",
        "",
        "command: " + browser
      ].join('\n'));

      return cb(err);
    }

    cb();
  });
}
