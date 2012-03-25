## gh-fetch [![Build Status](https://secure.travis-ci.org/mklabs/gh-fetch.png)](http://travis-ci.org/mklabs/gh-fetch)

A little tool to fetch files from any repository on github, by typing
the `user/repository` and a list of glob patterns.

---

It'll let you automatically pull in the lastest copy of a file (or a set
of files). Specify a repo, a branch (defaults to master) and list of
files you'd like to fetch.

    Usage: gh-fetch [user/repo] [globs, ...]

    Options:

      --whereto <dir>          output directory, defaults to ./user/repo/branch
      --branch <branch>        switch from default master branch
      --dry                    run in dry mode (eg. no file writes)
      --silent                 run in silent mode (eg. no output)
      -v, --version            output program version
      -h, --help               display help information

### example

    gh-fetch user/repository *.html **/*.js docs/**.md

    # specifiy the output dir
    gh-fetch user/repository lib/**/*.js --whereto ./js/libs

    # switch from default master and specify a specific branch
    gh-fetch user/repository --branch dev

    # go crazy.. fetch all!
    gh-fetch user/repository **.*

    # not so crazy.. fetch all! but don't write anything in dry mode
    # to get a preview of a glob match or see what would gets copied and where
    gh-fetch user/repository **.* --dry

    gh-fetch user/repository **.* --dry --whereto somewhere/else


### install

This should work on osx / unix and windows

    npm install https://github.com/mklabs/gh-fetch/tarball/master -g

### description

gh-fetch works by getting the list of files for a user repository
through github api usage, then filtered via
[minimatch](https://github.com/isaacs/minimatch) and the list of glob
patterns that were passed.

Download of files is then done by using
[request](https://github.com/mikeal/request)'s streaming ability to pipe
the results locally.

In short:

1. Request github api to get the full list of blobs
2. Filter the results by mapping the list of glob patterns provided.
3. Perform an http request to the raw file on github.
4. Pipe the results to `user/repo/branch/filepath` by default or `whereto/filepath` if `--whereto` option is provided.


### Using gh-fetch programmatically

Even though it was first developed to be used as a cli tool, ff you would like to use gh-fetch programmatically, you can do that. It's not very well documented, but it is rather simple.

    var gh = require('gh-fetch');

    // get the list of files matching the provided glob pattern
    gh.globs(['user/repostitory', 'some/**', 'glob/*.js'], options, function(err, rawurls, files) {
      if(err) return console.error(err);
      // list of github raw urls
      console.log('Urls:', rawurls);
      // list of files
      console.log('Files:', files);
    });

    // Fetch files locally
    gh.fetch(['user/repostitory', 'some/**', 'glob/*.js'], options, function(err) {
      if(err) return console.error(err);
    });


`options` is an hash object with the following values:

* *whereto*: path of the install dirname, defaults to
  `./user/repo/branch`. If specified, install dirname is then
  `./path/to/whereto` with files fetched without the nested repository
  structure.
* *dry*: defaults to false. if set, will prevent file write
  and just output to the console guessed github url and install
  location.
* *silent*: defaults to true. Run in silent mode, eg. no console
 output.

to add: `options.cwd`, `options.fullpath`

### Run the tests

    npm test

Check out the [test](https://github.com/mklabs/gh-fetch/tree/master/test) directory for more examples.

### Real use cases

> Let’s say that you’re a fan of [Normalize.css](http://necolas.github.com/normalize.css/). Perhaps, you download it and save it to a snippet, or store the stylesheet, itself, in an assets folder. That way, for future projects, you only need to copy and paste.

I do admit that I'm a big fan of [normalize.css](https://github.com/necolas/normalize.css). Let's do that exact use case as described in this [article](http://net.tutsplus.com/articles/news/introducing-nettuts-fetch/#post-23490) (from which this project is inspired)

Let's do a dry run first, with a "catch all" pattern.

    $ gh-fetch necolas/normalize.css ** --dry
    log   - Installing... necolas/normalize.css **
    debug -
    debug -{ blobs:
    debug -   { '.gitignore': '974a733b4ea1f5b1772b630718d89b4fbffb5ded',
    debug -     'normalize.css': '0e289ab94ce810716f4864c16613e86d56d99874',
    debug -     'demo.html': 'da2854ac5d24d985d77f5dd3db48c5574c0d00f6',
    debug -     'README.md': 'c81c94ac04891bb3b5864bcf811b829b6f94fb76' } }

    debug - https://raw.github.com/necolas/normalize.css/master/normalize.css
    debug -   >> ./necolas/normalize.css/master/normalize.css
    debug - https://raw.github.com/necolas/normalize.css/master/demo.html
    debug -   >> ./necolas/normalize.css/master/demo.html
    debug - https://raw.github.com/necolas/normalize.css/master/README.md
    debug -   >> ./necolas/normalize.css/master/README.md
    debug - install done in 0.315s

Sweet, now do the fetch, but instead of default ./necolas/normalize.css/master/ dir, fetch in ./assets/

    $ gh-fetch necolas/normalize.css *.css --whereto ./assets/
    log   - Installing... necolas/normalize.css *.css
    debug - https://raw.github.com/necolas/normalize.css/master/normalize.css
    debug -   >> ./assets/normalize.css
    debug - install done in 1.282s

Boom, done.

***some more***

    gh-fetch h5bp/html5-boilerplate *.html
    gh-fetch h5bp/html5-boilerplate js/**.js
    gh-fetch twitter/bootstrap js/**.js
    gh-fetch twitter/bootstrap lib/*

    # put files here instead of default twitter/bootstrap/master location
    gh-fetch twitter/bootstrap lib/* --whereto bootstrap


    # get all the less files in 2.0 branch
    gh-fetch twitter/bootstrap less/* --whereto bs2 --branch 2.0-wip
