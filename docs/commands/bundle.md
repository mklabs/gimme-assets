gimme-bundle(1) - Concat and minifiy the given package(s) and local files
=========================================================================

    gimme bundle <lib, ...>


This command lets you minifiy / concat a bunch of lib into a single,
optimized bundle.

    gimme bundle jquery underscore.js backbone.js

Will output to standard output jquery, underscore and backbone contents,
in the same order.

Javascript files that not ends with `min.js` are automatically minified,
unless the `--nocompress` option was given.

Local files can be added to the bundle, and the order of bundle output
should be as expected.

    gimme bundle jquery underscore.js backbone.js ./test/*.js

`--copy` lets you switch the output to be `pbcopy` instead of the
default standard output. This will copy the bundle output right into
your clipboard.

The `--output` option (or `-o`) lets you write the bundle output to a
local file, instead of stdout output or clipboard copy.

    gimme bundle jquery underscore.js backbone.js --output js/bundle.min.js

    # really similar to
    gimme bundle jquery underscore.js backbone.js >> js/bundle.min.js


## Configuration

### copy

* Default: false
* Type: Boolean

When `--copy` is turned on, the output is piped to `pbocpy` instead of
stdout.

### output

* Type: String

When specified, bundle gets written to this local file instead of stdout
output or clipboard copy.

### clipboard

Same as `--copy`

### pbcopy

Same as `--clipboard`

