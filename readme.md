
Experimental asset manager, based on [cdnjs](https://github.com/cdnjs/cdnjs) scripts.

quick description: On install, the cdnjs repository is cloned in
`~/.gimme-assets/cdnjs`. Versions from package.json files are semver
validated, and slightly adjusted if necessary. `npm` is then used to
install assets in the local `node_modules`, from where the content of
the specified version is copied over the `--output` option (defaults to
`./js/libs`)

## install

    git clone git://github.com/mklabs/gimme-assets.git
    cd gimme-assets
    npm install && npm link

Or

    npm install https://github.com/mklabs/gimme-assets/tarball/master -g

## Synopsis

    $ npm install https://github.com/mklabs/gimme-assets/tarball/master -g
    $ gimme

      Usage: gimme [command] [options]

      Commands:
        completion              setup tab completion
        docs <name>             guess the likely location of a package's documentation URL, and then tries to open it using the --browser config param.
        install <name ...>      installs the lib <name ...>
        list                    list available package
        readme <name>           if supplied a package name, then show the appropriate documentation manpage generated from readme file

      Options:

        -o, --out <dir>          output directory defaulting to ./js/libs
        -l, --loglevel <level>   What level of logs to report
        -v, --version            output program version
        -h, --help               display help information


    $ gimme <tab><tab>
    completion  docs        install     list        readme

    $ gimme install r<tab>

    $ gimme install s<tab>
    sammy.js       script.js      scriptaculous  selectivizr    sizzle         socket.io      spinejs        store.js       string_score

    $ gimme install underscore.js backbone.js jquery
    log   - Installing... underscore.js backbone.js jquery
    debug - Return the highest version in the list that satisfies the range (or `*` by defaults)
    debug - dir /Users/mk/Temp/dev/mklabs/gimme-assets
    info  - Installing underscore.js@1.2.1 into js/libs
    debug - Copying /Users/mk/Temp/dev/mklabs/gimme-assets/node_modules/underscore.js/1.2.1  →  /Users/mk/Temp/dev/mklabs/gimme-assets/js/libs
    debug - dir /Users/mk/Temp/dev/mklabs/gimme-assets
    info  - Installing backbone.js@0.5.3 into js/libs
    debug - Copying /Users/mk/Temp/dev/mklabs/gimme-assets/node_modules/backbone.js/0.5.3  →  /Users/mk/Temp/dev/mklabs/gimme-assets/js/libs
    debug - dir /Users/mk/Temp/dev/mklabs/gimme-assets
    info  - Installing jquery@1.6.4 into js/libs
    debug - Copying /Users/mk/Temp/dev/mklabs/gimme-assets/node_modules/jquery/1.6.4  →  /Users/mk/Temp/dev/mklabs/gimme-assets/js/libs
    debug - /Users/mk/Temp/dev/mklabs/gimme-assets/node_modules/underscore.js/1.2.1/underscore-min.js -> /Users/mk/Temp/dev/mklabs/gimme-assets/js/libs/underscore-min.js
    debug - /Users/mk/Temp/dev/mklabs/gimme-assets/node_modules/backbone.js/0.5.3/backbone-min.js -> /Users/mk/Temp/dev/mklabs/gimme-assets/js/libs/backbone-min.js
    debug - /Users/mk/Temp/dev/mklabs/gimme-assets/node_modules/jquery/1.6.4/jquery.min.js -> /Users/mk/Temp/dev/mklabs/gimme-assets/js/libs/jquery.min.js
    debug - install done in 0.434s

## commands

### gimme install

    gimme install (with no args in a package dir)
    gimme install <name ...>

when no args, tries to read the `gimme` entry of your package.json.
The format is simply an array of library names (since there's no
version management).

### gimme list

    gimme list
    gimme list query

List available assets with optional query.

### gimme completion

    gimme completion
    gimme completion install

Enables tab-completion in gimme commands.

The synopsis above loads the completions and add it to your ~/.bashrc or
~/.zshrc, making the completions available everywhere. `gimme
completion` alone output the completion bash script, `gimme completion
install` is the equivalent of running `gimme completion >> ~/.bashrc
(or ~/.zshrc)`

### gimme readme

    gimme readme <name>

This command tries to guess at the likely location of a repository's
readme, and then tries to generate a manpage using [ronnjs](https://github.com/kapouer/ronnjs).


### gimme docs

    gimme docs <name>

This command tries to guess at the likely location of an asset's documentation URL, and then tries to open it using the --browser config param.


### todos

#### gimme update

    gimme update

Refresh the data.js cache in `$HOME/.gimme` (git cloned repo) by pulling from master.

#### gimme uninstall

    gimme uninstall (with no args in a package dir)
    gimme uninstall <name ...>

Same usage as `gimme install`, but removes from locally installed
gimme libs (defaults in `./js/libs`)

#### gimme help

    gimme help
    gimme help <command>

Get help on any commands.

#### gimme search

    gimme search
    gimme search <tag ...>

Search available assets with optional list of tags.

#### gimme concat

    gimme concat <name ...>
    gimme concat <name ...> --out ./js/scripts-concat.js
    gimme concat <name ...> --echo >> ./js/scripts-concat.js

Install and concat files (all already minified) in the output directory,
defaults to `./js/lib/:sha.scripts-concat.js` (where `:sha` is the file
md5 hash).

#### gimme add

    gimme add <name> <url>

Adds a new assets ressource to the local environment, then returned by
`gimme list` and installable via `gimme install`.

url could match a js/css/html ressource. The script should output then
output in `js/libs`, `css`, or `./`.


#### options

    -o, --out <dir>   output directory defaulting to `./js/lib`
    -v, --version     output program version
    -l, --loglvel     What level of logs to report
    -h, --help        display help information

