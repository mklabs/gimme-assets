gimme-install(1) - Installs the lib(s)
======================================

    gimme install <asset>
    gimme install <asset> <asset ...>

This command installs a package, or a set of packages in `--output`.

If used in package directory, with no arguments, it then tries to run
the install command defined in package.json `gimme` property.


## Configuration

### base

* Default: `$cwd`
* Type: String

The base directory to work from.

### output

* Default: `./js/libs`
* Type: String

When specified, packages get installed to this local file instead of the default `./js/libs`.

### dry

* Default: false
* Type: Boolean

When turned on, this won't copy the files to `--output`. If this is the
first install for the given packages, it then just downloads and fetch to
cache dir. Otherwise, noop.

