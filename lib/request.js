

var request = require('request'),
  exec = require('child_process').exec,
  env = process.env,
  proxy = env.HTTP_PROXY || env.http_proxy;

// module.exports = request.defaults('');
module.exports = proxy ? curl : request;


// fallback whenever a proxy is set in env, getting crappy error
// even when I set request.defaults proxy. Close to the simple form of
// request api.
//
// Curl if environment are setup properly works just fine in my proxied environment.
//
// todo: should probably which the curl executable, prior tu usage.
function curl(url, callback) {
  exec('curl -I ' + url, function(err, stdout) {
    if(err) return callback(err);

    // parse the response status
    var m = stdout.match(/HTTP\/1\.1\s([\d]{3})\s?/) || [],
      status = +m[1];

    if(status !== 200) return callback(null, { statusCode: status});

    exec('curl ' + url, function(err, stdout) {
      if(err) return callback(err);
      callback(null, { statusCode: 200 }, stdout);
    });

  });
}
