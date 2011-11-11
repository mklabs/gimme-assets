
var console = require('../logger');

module.exports = add;
add.usage = "add <name> <url>";
add.description = ["add", "Adds a new ressource assets to the local environment"];
add.complete = function(o, cb) {
  return cb(null, []);
};


function add(opts, cb) {

  // case of no args: prompt
  // should write content to prefix/extraneous.json, with a basic list
  // of `{ "name": "url" }`.
  //
  // install/list and other commands should look first at this file,
  // before loding in from cdnjs source.
  //
  // `add` could be used with a path to a config.json file, to add
  // multiple assets at once. entries: name, description, url, source,
  // (optional) tags
  console.log('todo: write this command.');
  cb();
}
