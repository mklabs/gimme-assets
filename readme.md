
Experimental asset manager, based on [cdnjs](https://github.com/cdnjs/cdnjs) scripts.

quick description: On install, the cdnjs repository is cloned in
`~/.gimme-assets/cdnjs`. Versions from package.json files are semver
validated, and slightly adjusted if necessary. `npm` is then used to
install assets in the local `node_modules`, from where the content of
the specified version is copied over the `--output` option (defaults to
`./js/libs`)


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

#### gimme docs

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


#### gimme readme

    gimme readme <name>

This command tries to guess at the likely location of a repository's
readme, and then tries to generate a manpage using [ronnjs](https://github.com/kapouer/ronnjs).

#### gimme search

    gimme search
    gimme search <tag ...>

Search available assets with optional list of tags.

#### options

    -o, --out <dir>   output directory defaulting to `./js/lib`
    -v, --version     output program version
    -l, --loglvel     What 
    -h, --help        display help information

