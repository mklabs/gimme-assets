
Experimental asset manager, based on [cdnjs](https://github.com/cdnjs/cdnjs) libs.

## Description

gimme is a little, experimental tool to manage web assets from the CLI.

## Usage

    Usage:
       gimme [command] [options]

    Commands:
      gimme completion              Setup tab completion
      gimme list                    List available packages
      gimme html                    Show HTML snippets to include package
      gimme readme <name>           Show the appropriate documentation manpage generated from readme file
      gimme docs <name>             Tries to open package's documentation using default browser
      gimme install <name ...>      Installs the lib(s) <name ...>

    Options:

      -o, --out <dir>          output directory defaulting to ./js/libs
      -l, --loglevel <level>   What level of logs to report
      -v, --version            output program version
      -h, --help               display help information

## Synopsis

**install new packages**

    $ gimme install underscore.js backbone.js jquery
    log   - Installing... underscore.js backbone.js jquery
    log   - all done
    debug - install done in 1.348s

**open the package homepage**

using default browser

    gimme docs socket.io

**view project's readme as manpage**

    gimme readme socket.io

**list all available packages**

    gimme list

## commands

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

This command tries to guess at the likely location of an asset's
documentation URL, and then tries to open it using the default browser.

### todos

#### gimme update

    gimme update

Refresh the data.js cache in `$HOME/.gimme`

#### gimme uninstall

    gimme uninstall (with no args in a package dir)
    gimme uninstall <name ...>

Same usage as `gimme install`, but removes the locally installed
(defaults in `./js/libs`)

#### gimme search

    gimme search
    gimme search <tag ...>

Search available assets with optional list of tags.

## Creating a new command

> TODO

#### gimme html

    gimme html <name ...>

Would show the html snippet to include given package. Defaults returns
the html snippet to include the cdnjs libs with local fallback.

## install

    git clone git://github.com/mklabs/gimme-assets.git
    cd gimme-assets
    npm install && npm link

Or

    npm install https://github.com/mklabs/gimme-assets/tarball/master -g
