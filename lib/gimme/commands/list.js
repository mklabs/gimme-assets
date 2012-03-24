
var fs = require('fs'),
  path = require('path'),
  gimme = require('../../../'),
  prefix = gimme.config.get('defaults').prefix;

module.exports = list;

list.usage = 'gimme list';
list.description = ['list', 'List available packages'];

list.package = package;
list.packages = packages;

function list(opts, cb) {
  var terms = opts.argv.remain.slice(1),
    ln = terms.length,
    app = this;

  var libs = filter(packages(), terms);

  app.debug('Found', libs.length, 'results');

  var output = libs.map(function(pkg) {
    if(!pkg.name || !pkg.description) return '';
    return '   » ' + pad(stylize(pkg.name), 40) + pad(pkg.description, 100);
  });

  console.log(output.join('\n'));
}

// **filter** filters out package depending on provided terms
function filter(packages, terms) {
  if(!terms.length) return packages;

  terms = terms.map(function(term) {
    return new RegExp(term);
  });

  return packages.filter(function(pkg) {
    return terms.filter(function(term) {
      return term.test(pkg.name);
    }).length;
  });
}

function stylize(msg) {
  var bold = [1, 22];
  return '\033[' + bold[0] + 'm' + msg + '\033[' + bold[1] + 'm';
}

function pad(msg, padding) {
  var ln = padding - msg.length;
  return ln > 0 ? msg + new Array(ln).join(' ') : msg.substring(0, padding) + '...';
}

function package(lib) {
  return packages().filter(function(p) { return p.name === lib; })[0];
}

function packages(key) {
  return JSON.parse(fs.readFileSync(path.join(prefix, 'gimme.json'), 'utf8')).map(function(pkg) {
    return key ? pkg[key] : pkg;
  });
}
