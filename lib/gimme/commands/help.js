
var fs = require('fs'),
  path = require('path'),
  join = path.join,
  extname = path.extname;

//
// Help command
//
// Show the appropriate documentation page for the given command.
//

module.exports = help;

help.usage = ['gimme help <topic>'];
help.description = ['help', 'Shows the appropriate documentation page for the given command']

help.complete = function(o, cb) {
  cb(null, Object.keys(this.commands));
};

var docsPath = join(__dirname, '../../../docs/commands');

function help(opts, cb) {
  var app = this,
    viewer = app.get('viewer'),
    topic = opts.args[0],
    topics = Object.keys(app.commands),
    alias = app.get('aliases'),
    valid = !!~topics.indexOf(topic);

  if(!topic) return app.showHelp(cb);

  app.debug('Show documentation for ', topic);

  // is it a valid topic?
  if(!valid) {
    app.error(topic, 'is not a valid command');
    return cb();
  }

  app.debug('Looking up in ', docsPath);

  fs.readdir(docsPath, function(err, files) {
    if(err) return cb(err);
    if(!files.length) return cb();

    // resolve alias
    topic = alias[topic] || topic;
    var page = files.filter(function(file) {
      var name = extname(topic) ? name : topic + '.md';
      return name === file;
    })[0];

    if(!page) {
      app.error('No results found for ', topic)
        .error('Despite beeing a valid command')
        .error('If you are mklabs, you should stop writing fancy error message and go write documentation.');
      return cb();
    }

    // we have a match! output based on viewer
    fs.createReadStream(join(docsPath, page)).on('end', cb).pipe(process.stdout);
  });

}
