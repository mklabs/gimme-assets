
var fs = require('fs'),
  path = require('path'),
  zlib = require('zlib'),
  tar = require('tar');

// Check if we're behind some kind of proxy.
var proxy = process.env.http_proxy || process.env.HTTP_PROXY ||
    process.env.https_proxy || process.env.HTTPS_PROXY || '';

module.exports = fetch;
fetch.github = github;

var request = fetch.request = require('request').defaults({ proxy: proxy  });

// heavily based on npm's util/untar.js file
function fetch(tarball, target, cb) {
  var now = +new Date;

  cb = cb || function() {};

  // tarball untar opts
  var extractOpts = { type: 'Directory', path: target, strip: 1 };

  // remote request --> zlib.Unzip() --> untar into {{ target }}
  var req = request.get(tarball).on('error', cb);

  req
    // first gzip
    .pipe(zlib.Unzip())
    .on('error', cb)
    // then tar extract into h5bp/root
    .pipe(tar.Extract(extractOpts))
    .on('entry', function(entry) {
      // weirdy, todo, better handle this.
      entry.props.uid = entry.uid = 501;
      entry.props.gid = entry.gid = 20;
    })
    .on('error', cb)
    .on('close', cb);

  return req;
}

//
// convenience method for fetching a given tarbal on a github repo.
//
function github(user, repo, branch, target, cb) {
  var tarball = 'http://nodeload.github.com/' + user + '/' + repo + '/tarball/' + branch;
  return fetch(tarball, target, cb);
}
