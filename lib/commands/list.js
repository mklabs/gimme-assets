
var path = require('path'),
  fs = require('fs'),
  prefix = path.join(process.env.HOME, '.gimme-assets', 'cdnjs', 'ajax', 'libs');

module.exports = list;

list.usage = 'gimme list';
list.description = ['list', 'list available package'];

function list(opts, cb) {

  var libs = opts.argv.remain.slice(1),
    remaining = libs.length;

  if(remaining) return cb(new Error('list does not take additionnal args.\n' + list.usage));

  var output = fs.readdirSync(prefix).map(function(file) {
    var desc = JSON.parse(fs.readFileSync(path.join(prefix, file, 'package.json'), 'utf8')).description;
    return '   » ' + pad(stylize(file), 40) + pad(desc, 150);
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
