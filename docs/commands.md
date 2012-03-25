
## Creating a new command

The `~/.gimme` folder is the special folder create by gimme, in which
you put a bunch of stuff, namely command definition.

`gimme` will include any built-in commands (in `lib/gimme/commands`) to
its command definitions, it then lookup the `~/.gimme/commands`
directory to include additional command. You may even override a
built-in command as custom ones take precedence on built-ins.

Commands are simply commonjs module that exposes a function to which are
attached `usage`, `description` and optional `complete` callback.

The main handler is passed in
[nopt](https://github.com/isaacs/nopt#readme) parsed arguments, a
callback to invoke on completion and are executed in the context of
`gimme`, (eg `gimme === this`, hence you should be able to access the whole api).


### Example

    mkdir ~/.gimme/commands
    touch ~/.gimme/commands/test.js

Add the following to `~/.gimme/commands/hello.js`

    module.exports = hello;

    hello.usage = "gimme hello <pkgname>";
    hello.description = ['hello <name>', "best command ever"];
    hello.complete = function() {};

    function hello(opts, cb) {
      var args = opts.argv.remain.slice(1),
        app = this;

      app.info('Hello', args.join(' '));
      cb();
    }

You should then see the new `hello` command in `gimme help`.

And running `gimme hello --help` should output the following

    hello <name> - best command ever
    ================================

    gimme hello <pkgname>

*Usage*

    $ gimme hello
    info  - Hello

    $ gimme hello from inside a custom command
    info  - Hello from inside a custom command


