var vows = require('vows'),
  assert = require('assert'),
  path = require('path'),
  fs = require('fs'),
  gh = require('../');

vows.describe("gh.fetch").addBatch({
  "When used against joyent/node and **/*.markdown": {
    topic: function() {
      var cb = this.callback;
      gh.fetch(['joyent/node', '**/*.markdown'], {}, function(err) {
        if(err) return cb(err);

        var into = path.resolve('joyent/node/master');
        fs.readdir(into, cb);
      });
    },

    "should fetch the full api doc into joyent/node/master": function(err, files) {
      if(err) return assert.fail(err);
      assert.ok(!!~files.indexOf('doc'), 'missing doc dir');

      // check some module we know should be there
      ['events', 'fs', 'vm'].forEach(function(file) {
        assert.ok(path.existsSync(path.resolve('joyent/node/master/doc/api', file + '.markdown')), 'missing ' + file);
      });
    }
  },

  "When used against h5bp/html5-boilerplate, *.html and **/*.css, with --whereto setup": {
    topic: function() {
      var cb = this.callback;
      gh.fetch(['h5bp/html5-boilerplate', '*.html', '**/*.css'], { whereto: './tmp'}, function(err) {
        if(err) return cb(err);
        var into = path.resolve('tmp');
        fs.readdir(into, cb);
      });
    },

    "should fetch both index.html and 404.html plus all css files into --whereto": function(err, files) {
      if(err) return assert.fail(err);
      // check some module we know should be there
      // check some file we know should be there
      ['404.html', 'index.html', 'css/style.css'].forEach(function(file) {
        assert.ok(path.existsSync(path.resolve('tmp', file)), 'missing ' + file);
      });
    }
  }
}).export(module);
