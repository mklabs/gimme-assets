
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

  var libs = filter(packages(), terms),
    limit = app.get('limit'),
    ln = libs.length;

  app.debug('Found', ln, 'results');
  // if it exceeds `limit` then output as paginated list
  if(limit && ln > limit) return paginate(app, libs, limit, cb);

  var output = libs.map(format);
  console.log(output.join('\n'));
  cb();
}

// **format** returns the string padded representation of `pkg`
function format(pkg) {
  if(!pkg.name || !pkg.description) return '';
  return '   » ' + pad(stylize(pkg.name), 40) + pad(pkg.description, 100);
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

// **paginate** output list as paginated list, based on `limit` value.
// `n`, `p`, 'q' may be used to go next, previous.
function paginate(app, libs, limit, cb) {
  // prompt properties
  var props = {
    message: '[N]ext, [P]revious, [Q]uit',
    name: 'control',
    validator: /^[npq]$/i,
    warning: 'Must be either `n`, `p` or `q`',
    default: 'n'
  };

  var index = 0,
    ln = libs.length,
    lr = app.get('lr');

  (function prompt(libs, offset) {
    var to = offset + limit,
      rel = to < 0 ? ~to : to,
      range = libs.slice(offset, offset + limit);

    if(rel > libs.length && !range.length) return process.exit(0);

    console.log(format({ description: '«', name:  '---------- ' + offset + ' → ' + to + ' --------' }));
    console.log(range.map(format).join(lr));
    app.prompt.get(props, function(e, o) {
      if(e) return cb(e);
      var next = (/n/i).test(o.control),
        prev = (/p/i).test(o.control),
        quit = (/q/i).test(o.control);

      props.default = o.control;

      if(quit) process.exit(0);
      if(next) return prompt(libs, offset + limit);
      if(prev) return prompt(libs, offset - limit);
    });

  })(libs, index);

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
