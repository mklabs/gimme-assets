gimme-html(1) - Show HTML snippet to include given package(s)
=============================================================

    gimme html <lib, ...>

This command will print to stdout all the packages url with surrounding
`<script>` tags, unless `--url` was given in which case only the src
value is displayed. 

It can take a list of packages, in which case the return output is
composed of the guessed url, in the order they were added in the command
line.

    $ gimme html jquery underscore.js backbone.js keymaster
    <script src="http://cdnjs.cloudflare.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
    <script src="http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.3.1/underscore-min.js"></script>
    <script src="http://cdnjs.cloudflare.com/ajax/libs/backbone.js/0.9.1/backbone-min.js"></script>
    <script src="https://raw.github.com/madrobby/keymaster/master/keymaster.js"></script>

Add a `--clipboard` or `--copy` option somewhere and it'll pipe the
output to `pbcopy` instead of stdout.

## Configuration

### copy

* Default: false
* Type: Boolean

When `--copy` is turned on, the output is piped to `pbocpy` instead of
stdout.

### url

* Default: false
* Type: Boolean

Show url instead of full `<script src=":src"></script>`.

### defer

* Default: false
* Type: Boolean

Only relevant when `url` is false. Add a `defer` attribute to the script
tags. Before using `--defer`, you shoud go on with some good reading on
why you should do with care:

* https://github.com/h5bp/html5-boilerplate/issues/961
* https://github.com/paulirish/lazyweb-requests/issues/42

### clipboard

Same as `--copy`

### pbcopy

Same as `--clipboard`
