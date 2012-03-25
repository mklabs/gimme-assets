
Experimental asset manager, based on [cdnjs](http://www.cdnjs.com/) and
[microjs](http://microjs.com/)libs.

## Description

gimme is a little, experimental tool to manage web assets from the CLI.

It comes with 250+ available package to install right off the bat, and
if that's not enough you can create your own package definition.

## Usage


    Experimental asset manager for cdnjs / microjs libs.

    Usage: gimme <cmd> [options]

    Commands:
      add                     Add a new bundle definition
      bundle                  Concat and minifiy the given package(s) and local files
      completion              Setup tab completion
      docs                    Tries to open package's documentation using default browser
      help                    Shows the appropriate documentation page for the given command
      html                    Show HTML snippet to include given package(s)
      install                 Installs the lib(s) <name ...>
      list                    List available packages
      readme                  Show the appropriate documentation manpage generated from readme file

    Options:
     -l, --loglevel           What level of log to report
     -o, --output             Output directory, defaults to ./js/libs
     -v, --version            Output program version
     -d, --debug              Slighly more verbose error output when set to true, defaults false
     -ll, --limit             Maximum number of results to output with paginated list
     -h, --help               Display help information
     --props                  Optional list of package properties to output with list
     --usage                  Display usage for given subcommand
     --viewer                 The program to use to view help content, if `markdown` then output to stdout
     --bundle                 When turned on, list will only display added bundles with `gimme add`
     --url                    When turned on, html command will output url without surrounding <script>
     -clipboard, --copy       When turned on, html command will pipe the output to pbocpy instead of stdout
     --nocompress             Disable minification for js files with `bundle` command

## Documentation

* [Usage](https://github.com/mklabs/gimme-assets/blob/dev/docs/usage.md)

**Commands**

* [add](https://github.com/mklabs/gimme-assets/blob/dev/docs/commands/add.md#readme)
* [bundle](https://github.com/mklabs/gimme-assets/blob/dev/docs/commands/bundle.md#readme)
* [docs](https://github.com/mklabs/gimme-assets/blob/dev/docs/commands/docs.md#readme)
* [help](https://github.com/mklabs/gimme-assets/blob/dev/docs/commands/help.md#readme)
* [html](https://github.com/mklabs/gimme-assets/blob/dev/docs/commands/html.md#readme)
* [install](https://github.com/mklabs/gimme-assets/blob/dev/docs/commands/install.md#readme)
* [list](https://github.com/mklabs/gimme-assets/blob/dev/docs/commands/list.md#readme)
* [readme](https://github.com/mklabs/gimme-assets/blob/dev/docs/commands/readme.md#readme)

**creating a new command**

* [commands](https://github.com/mklabs/gimme-assets/blob/dev/docs/commands.md#readme)

## Install

    npm install gimme-assets -g

## Tests [![Build Status](https://secure.travis-ci.org/mklabs/gimme-assets.png?branch=master)](http://travis-ci.org/mklabs/gimme-assets)

    npm test

Create a new test

    node test --create testname

