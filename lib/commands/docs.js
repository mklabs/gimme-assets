
var exec = require('child_process').exec,
  path = require('path'),
  fs = require('fs'),
  npm = require('npm'),
  console = require('../logger'),
  commands = require('../commands'),
  prefix = path.join(process.env.HOME, '.gimme-assets', 'cdnjs', 'ajax', 'libs');

module.exports = docs;

docs.usage = "gimme docs <pkgname>";
docs.description = ['docs <name>', "tries to guess at the likely location of a package's documentation URL, and then tries to open it using the --browser config param."];

docs.complete = function (o, cb) {
  cb(null, commands.list.readdirSync());
};

function docs (opts, cb) {
  var args = opts.argv.remain.slice(1);
  if (!args.length) return cb(docs.usage);

  var n = args[0].split("@").shift(),
    file = path.join(prefix, n, 'package.json');

  console.debug('Looking for', n, 'package');
  return path.exists(file, function(exists) {
    if(!exists) {
      console.warn('Unknown package', n);
      return open('http://www.cdnjs.com/#/search/' + n, cb);
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
      repo = repo.replace(/^git(@|:\/\/)/, 'http://').replace(/\.git$/, '');
      return open(repo + "#readme", cb);
    });
  });
}

function open(url, cb) {

  var browser = npm.config.get('browser');

  exec(browser + ' ' + url, function(err) {
    if(err) {
      console.warn([
        "Failed to open "+url+" in a browser.  It could be that the",
        "`browser` config is not set. Try doing this:",
        "   npm config set browser google-chrome",
        "or: ",
        "   npm config set browser lynx"
      ].join('\n'));

      return cb(err);
    }
  });
}
