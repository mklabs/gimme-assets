
var fs = require('fs'),
  path = require('path');

var userpath = path.join(process.env.HOME || process.env.USERPROFILE, '.gimme/commands'),
  builtinpath = path.join(__dirname, 'commands');

// map over the `commands` dir, setup all commands as lazy-loaded getters
var cmds = exports;

// first, grab any built-in commands
var commands = fs.readdirSync(builtinpath).map(resolveTo(builtinpath));

// then, include any user-specific commands
if(path.existsSync(userpath)) commands = commands.concat(fs.readdirSync(userpath).map(resolveTo(userpath)));

commands.forEach(function(file) {
  var command = path.basename(file).replace(path.extname(file), '');

  cmds.__defineGetter__(command, function() {
    return require(file);
  });
});


function resolveTo(prefix) { return function(f) {
  return path.resolve(prefix, f);
}}
