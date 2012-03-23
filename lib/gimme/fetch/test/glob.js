var vows = require('vows'),
  assert = require('assert'),
  gh = require('../');

vows.describe("gh.glob").addBatch({
  "When used against joyent/node and **/*.markdown": {
    topic: function() {
      gh.glob(['joyent/node', '**/*.markdown'], { dry: true }, this.callback.bind(this));
    },

    "should return the full api doc": function(err, rawurls, files) {
      err = rawurls instanceof Error ? rawurls : err;
      if(err) return assert.fail(err);

      assert.ok(files.length, 'should have files array with items');
      assert.ok(rawurls.length, 'should have files array with items');

      assert.ok(rawurls.length === files.length, 'should both arrays have the same length');

      files.forEach(function(file, i) {
        assert.equal('https://raw.github.com/joyent/node/master/' + files[i], rawurls[i]);
      });
    }
  }
}).export(module);
