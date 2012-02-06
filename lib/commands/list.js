
var fs = require('fs'),
  path = require('path'),
  prefix = path.join(process.env.HOME, '.gimme');

module.exports = list;

list.usage = 'gimme list';
list.description = ['list', 'List available packages'];

list.package = package;
list.packages = packages;

function list(opts, cb) {
  var libs = opts.argv.remain.slice(1),
    remaining = libs.length;

  if(remaining) return cb(new Error('list does not take additionnal args.\n' + list.usage));

  var output = packages().map(function(pkg) {
    if(!pkg.name || !pkg.description) return '';
    return '   » ' + pad(stylize(pkg.name), 40) + pad(pkg.description, 100);
  });

  console.log(output.join('\n'));
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

function packages(key, file) {
  file = file || 'packages.json';
  return JSON.parse(fs.readFileSync(path.join(prefix, file), 'utf8')).packages.map(function(pkg) {
    return key ? pkg[key] : pkg;
  });
}
