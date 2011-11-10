* cdnjs port: right now the few command (list/install) are tailored to
microjs use

* the package, instead of http getting the files (via request, http,
 curl, or wget), would clone the cdnjs repository (via https)
  * would then resolve the proxy problem (assumed the clone is ok at
    install)
  * probably won't need to handle a "cache" system (was in `~/.gimme`)

* may add a plugin systems (or not) to add other assets ressource, like
  microjs, css/index.html from h5bp, css from bootstrap (propose less
  files instead).

* commands:

  * install: install the assets in js/libs (for js stuff)
  * udpate: refresh the cdnjs cache (git cloned repo) by pulling from master
  * uninstall: same as install, bu removes installed assets
  * help: get help on any commands.
  * search: search available assets with optional list of tags.
  * list: list available assets with optional query.
  * browse: tries to guess the likely location of an asset's
    documentation URL, and then tries to open using the --browser config
    param.
  * docs: tries to guess the likely location of an asset's
    repository markdown `readme`, tries to generate a manpage using
    [ronnjs](https://github.com/kapouer/ronnjs) and open the generate
    page using the man executable.


## commands

### gimme install

    gimme install (with no args in a package dir)
    gimme install <name ...>

when no args, tries to read the `gimme` entry of your package.json.
The format is simply an array of library names (since there's no
version management).

### gimme update

    gimme update

Refresh the data.js cache in `$HOME/.gimme` (git cloned repo) by pulling from master.

### gimme uninstall

    gimme uninstall (with no args in a package dir)
    gimme uninstall <name ...>

Same usage as `gimme install`, but removes from locally installed
gimme libs (defaults in `./js/libs`)

### gimme help

    gimme help
    gimme help <command>

### gimme browse

    gimme browse <name>

This command tries to guess at the likely location of an asset's documentation URL, and then tries to open it using the --browser config param.

### gimme docs

    gimme docs <name>

This command tries to guess at the likely location of a repository's
readme, and then tries to generate a manpage using [ronnjs](https://github.com/kapouer/ronnjs).

### gimme search

    gimme search
    gimme search <tag ...>

Search available assets with optional list of tags.

### gimme list

    gimme list
    gimme list query

List available assets with optional query.

#### options

    -c, --compress    compress assets (not relevent with cdnjs, all script are already minified)
    -o, --out <dir>   output directory defaulting to `./js/lib`
    -v, --version     output program version
    -h, --help        display help information

