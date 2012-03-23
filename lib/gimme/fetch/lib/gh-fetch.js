
var child = require('child_process'),
  fs = require('fs'),
  url = require('url'),
  path = require('path'),
  async = require('async'),
  mkdirp = require('mkdirp'),
  rimraf = require('rimraf'),
  request =  require('request'),
  minimatch = require('minimatch'),
  EventEmitter = require('events').EventEmitter;

var env = process.env,
  proxy = env.HTTP_PROXY || env.HTTPS_PROXY || env.http_proxy || env.https_proxy;

var dircache = path.join(process.env.HOME || process.env.USERPROFILE, '.gimme/fetch');

var gh = module.exports = {};

gh.fetch = function fetch(args, o, cb) {
  o = o || {};
  o.branch = o.branch || 'master';
  o.silent = o.silent || true;

  var em = new EventEmitter;

  gh.glob(args, o, function(err, rawurls, files) {
    if(err) return cb(err);
    var filecontents = {};

    function raw(url, cb) {
      var to = url.replace('https://raw.github.com/', ''),
        filepath = to.replace([args[0], o.branch].join('/'), '').replace(/^\//, ''),
        _cb = cb;

      cb = function() {
        em.emit('downloaded', url);
        return _cb.apply(this, arguments);
      };

      to = o.whereto ? path.resolve(o.whereto, filepath) : path.resolve(to);

      if(!o.silent) {
        console.log(url);
        console.log('  » ', to.replace(process.cwd(), '').replace(/\\/g, '/').replace(/^\//, './'));
      }

      if(o.dry) return cb();

      mkdirp(path.dirname(to), 0755, function(err) {
        if(err) return cb(err);

        em.emit('download', url);

        // proxied request works fine on http github api, seems like
        // this is not the case with raw urls.
        //
        // Perfrom a simple fallback to curl if we're in a proxied environment,
        // and that curl is known.
        proxy ? curl(url, to, o, cb) :
          request(url).pipe(fs.createWriteStream(to)).on('close', cb);
      });
    }

    em.emit('start', rawurls, rawurls.length);
    async[proxy ? 'forEachSeries' : 'forEach'](rawurls, raw, function(err) {
      if(err) return cb(err);
      em.emit('end');
      return cb();
    });
  });

  return em;
};

gh.glob = function glob(args, o, cb) {
  o = o || {};
  o.branch = o.branch || 'master';
  o.silent = o.silent || true;

  var repo = args[0],
    globs = args.slice(1);

  gh.cache('http://github.com/api/v2/json/blob/all/' + repo + '/' + o.branch, function(err, data) {
    if(err) return cb(err);
    if(data.error) return cb(new Error(repo + ' ' + data.error));

    var blobs = Object.keys(data.blobs),
      files = globs
        .map(function(glob) { return blobs.filter(minimatch.filter(glob, { matchBase: true })); })
        .reduce(function(a, b) { return a.concat(b); }, []);

    return cb(null, files.map(function(filename) { return 'https://raw.github.com/' + [repo, o.branch, filename].join('/'); }), files);
  });
};

gh.get = function get(uri, cb) {
  return request.get({url: uri, json:true, proxy: proxy}, cb);
};

// gh.cache - minimalist cache system on top of gh.get
//
// With completion commands, we must have some sort of cache system for the github api results,
// first completion on a user is fine if it take a little bit of time, once done it should be immediate.
//
// Cache may be rolled and refresh every day, or via config. Now, it's done by an explicit `cache clean` command.
gh.cache = function cache(uri, cb) {

  // clean trailing `/`
  uri = uri.replace(/\/$/, '');

  var filecache = path.join(dircache, url.parse(uri).pathname + '.json');

  fs.readFile(filecache, function(err, body) {
    if(!err) return cb(null, JSON.parse(body));

    // expected, first call
    gh.get(uri, function(err, response, data) {
      if(err) return cb(err);
      // write to our local cache
      mkdirp(path.dirname(filecache), 0755, function(err) {
        if(err) return cb(err);
        fs.writeFile(filecache, JSON.stringify(data, null, 2), function(err) {
          if(err) return cb(err);
          return cb(null, data);
        });
      });
    });
  });
};


// gh.clean - cleaning the cache out.
//
// Simplist, just removing the whole _cache dir for now. Might implement
// finer granularity and clean out the cache for one repo more specifically.
//
// Called from the cli when `ghf cache clean` has been typed.
gh.clean = function clean(args, o, cb) {
  var action = args[1],
    knowns = ['clean'];

  if(!action || !~knowns.indexOf(action)) return cb(new Error('Invalid cache action: ' + action + ' (' + knowns.join(', ') + ')'));

  rimraf(path.join(__dirname, '_cache'), cb);
};

// helpers

// curl - basic fallback and workaround with raw proxied request.
// Seems like request with proxy support works fine with github api requests,
// not with raws.
//
// todo switch the exec to piped spawned child, this will enable the
// and pipe to the current process the progress bar of curled request.
//
// This will also need to be called differently. Right now, all requests are made
// in the same time, in //. Regardless of the amount. This works pretty fine with
// request / writeStream, not with curled + write. Should probably do it in series or in
// a batch of 5 calls or something.
function curl(url, to, o, cb) {

  // first call, just header before going trhough the raw request
  child.exec('curl -I ' + url, function(err, stdout) {
    if(err) return cb(err);

    // parse the response status
    var m = stdout.match(/HTTP\/1\.1\s([\d]{3})\s?/) || [],
      status = +m[1];

    if(status !== 200) return cb(new Error('status code not a valid one ' + status + ' for url ' + url));

    // grab the file content, and write to the file system
    spawn('curl', ['-o', to, url, o.silent ? '--silent' : ''], function(code, stdout, stderr) {
      var err;
      if(code) {
        err = new Error('Error while curling ' + url);
        err.code = code;
        return cb(err);
      }

      cb();
    });
  });
}


function spawn(cmd, args, o, cb) {
  var stderr = [],
    stdout = [];

  if(!cb) {
    cb = o;
    o = {};
  }

  var ch = child.spawn(cmd, args, o);

//  ch.stdout.pipe(process.stdout, {end: false});
  ch.stderr.pipe(process.stderr);
  ch.stdout.on('data', function (data) { stdout[stdout.length] = data; });
  ch.stdout.on('data', function (data) { stderr[stderr.length] = data; });

  ch.on('exit', function(code) {
    stdout = stdout.join('\n');
    stderr = stderr.join('\n');
    if(cb) cb(code, stdout, stderr);
  });

  return ch;
}
