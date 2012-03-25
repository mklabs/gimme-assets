
var fs = require('fs'),
  join = require('path').join;

module.exports = html;

html.usage = 'gimme html <lib, ...>';
html.description = ['html', 'Show HTML snippet to include given package(s)'];

var cdnUrl = function(data, pkg, app) {
  return 'http://cdnjs.cloudflare.com/ajax/libs/:name/:version/:file'
    .replace(':name', data.name)
    .replace(':version', data.version)
    .replace(':file', data.file);
};

var microjsUrl = function(data, pkg, app) {
  var repository = (pkg.repository || pkg.repositories)[0],
    url = repository.url,
    github = !!~url.indexOf('github.com');

  if(!github || !pkg.branch || !pkg.repo) {
    app && app
      .warn(pkg.name, 'is a microjs lib and not on github')
      .warn('unable to guess url of', data.file)
      .warn('based on ', url);
    return '';
  }

  return 'https://raw.github.com/:repo/:branch/:filepath'
    .replace(':repo', pkg.repo)
    .replace(':branch', pkg.branch)
    .replace(':filepath', data.file);
};

var script = function(data) {
  return '<script:defer src=":src"></script>'
    .replace(':src', data.src)
    .replace(':defer', data.defer ? ' defer' : '');
};

html.complete = function(o, cb) {
  var last = o.last;

  // options complete
  var props = Object.keys(app.get('types')).map(function(p) { return '--' + p; });
  if(/^--?\w?/.test(last)) return cb(null, props);

  var libs = this.commands.list.packages('name', app.get('prefix'));
  cb(null, libs);
};

function html(opts, cb) {
  var app = this,
    libs = app.argv.remain.slice(1),
    list = app.commands.list;

  if(!libs.length) return app.info(html.usage);

  var out = libs.map(function(lib) {
    var pkg = list.package(lib, app.get('prefix'));
    if(!pkg) return app.warn('Unknwon lib', lib);

    var sources = Array.isArray(pkg.source) ? pkg.source : [pkg.source];

    var snippet = sources.map(function(source) {
      var o = { name: pkg.name, version: pkg.version, file: source },
        url = pkg.cdnjs ? cdnUrl(o, pkg, app): microjsUrl(o, pkg, app);

      return opts.url ? url : script({ src: url, defer: opts.defer });
    }).join('\n');

    return snippet;
  }).join('\n');

  console.info(out);

  cb();
}
