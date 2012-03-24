
var fs = require('fs'),
  path = require('path'),
  util = require('util');

module.exports = list;

list.usage = 'gimme list';
list.description = ['list', 'List available packages'];

list.package = package;
list.packages = packages;

function list(opts, cb) {
  var terms = opts.argv.remain.slice(1),
    ln = terms.length,
    app = this;

  var libs = filter(packages(false, app.get('prefix')), terms),
    limit = app.get('limit'),
    ln = libs.length;

  app.debug('Found', ln, 'results');
  // if it exceeds `limit` then output as paginated list
  if(limit && ln > limit) return paginate(app, libs, limit, opts.props, cb);

  var output = libs.map(format(app, opts.props));
  console.log(output.join('\n'));
  cb();
}

// **format** returns the string padded representation of `pkg`
function format(app, props) {
  props = props || [];
  var all = props[0] === 'true' || props[0] === 'all';
  props = all ? app.get('defaults').props : props;

  return function (pkg) {
    if(!pkg.name || !pkg.description) return '';
    var out = '   » ' + pad(stylize(pkg.name), 40);
    if(!props || !props.length) return  out + pad(pkg.description, 100);

    out += [''].concat(props.map(function(prop) {
      var out = typeof pkg[prop] !== 'string' ? inspect(pkg[prop], '          ') : pkg[prop];
      return pad(stylize('     » ' + prop + ': '), 30) + out;
    })).join(app.get('lr'));

    return out;
  };
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
function paginate(app, libs, limit, props, cb) {
  // prompt properties
  var promps = {
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

    console.log(format(app)({ description: '«', name:  '---------- ' + offset + ' → ' + to + ' --------' }));
    console.log(range.map(format(app, props)).join(lr));
    app.prompt.get(promps, function(e, o) {
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

function pad(msg, padding, right) {
  var ln = padding - msg.length,
    spaces = ln > 0 ? new Array(ln).join(' ') : '';
  if(!right) return ln > 0 ? msg + spaces : msg.substring(0, padding) + '...';
  return ln > 0 ? spaces + msg : msg;

}

function package(lib, preifx) {
  return packages(false, prefix).filter(function(p) { return p.name === lib; })[0];
}

function packages(key, prefix) {
  return JSON.parse(fs.readFileSync(path.join(prefix, 'gimme.json'), 'utf8')).map(function(pkg) {
    return key ? pkg[key] : pkg;
  });
}

function inspect(data, prefix) {
  return ('\n' + util.inspect(data, false, 4, true)).split('\n').map(function(line) {
    return !!line ? prefix + line : line;
  }).join('\n');
}
