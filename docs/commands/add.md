gimme-add(1) -- Add a new package definition
===========================================

    gimme add

This command lets you specifiy alternate packages, that are not
originally referenced on cdnjs.com or microjs.com.

The sources for added packages can be on the local disk, or as a remote
with a github repository.

The add command will prompt for various information about the package to
create:

* **name** Package name. The name will be used along `gimme install`
  once created.

* **description**: Mid to long description for the package.

* **version**: Package version.

* **homepage**: Project websites. Used with `gimme docs`.

* **keywords** Comma separated list of keywords.

* **repo**: Source repository on github, in the form of `user/repository`.

* **source**: Space separated list of glob patterns from within the
  source repository.

* **repositories** Used with `gimme readme`.
  * **type**: Defaults to git.
  * **url**: The remote git repo url.

* **dir** Output directory. This defaults to `js/libs` but you might
  want to have these files installed in some other location, eg. `css/`
  for stylesheets.

## Post install scripts

The `--postinstall` option may be used to setup a script to run on
completion. This can be used to further process the files that were
installed during `gimme install`.

This can be handy to handle files meant to be run through
pre-processors, like CoffeeScript, Less, Stylus or Saas.

Scripts are valid commonjs module that provides a new plugin definition.
These can be a single file or a node module. Each method is passed the
app object (`gimme`) and callback to invoke to pass control over.

    var postinstall = module.exports;

    postinstall.init = function(app, cb) {
      // initialization logic, should you need it. called before
      // `install` command
      cb();
    };

    postinstall.run = function(app, cb) {
      // get some info on what have been installed
      var installed = app.get('installed');

      // installed:
      //    - pkg: package info, with name, description, version, etc.
      //    - files: Array of files that have been installed, relative to $cwd
      //      (eg. ['js/libs/jquery.min.js', 'js/libs/jquery.js']

      cb();
    };

## Configuration

### postinstall

* Type: String

Path to postinstall script to run on completion. This can be aboslute or
relative to current workind directly.

### force

* Type: Boolean
* Default: false

If the package name already exists, an additional prompt confirmation
happens. `--force` let you skip this step and force the replace.

### prompt overrides

The `add` command prompts for user inputs for a bunch of information,
one may want to override some if not all of these values.

`--name`, `--description`, `--version`, `--homepage`, `--keywords`,
`--repo`, `--source`, `--repository-type` and `--repository-url` are all
options that can be passed in as command-line options.

