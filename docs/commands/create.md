gimme-create(1) - Creates a project using optional --template
=============================================================

    gimme create
    gimme create --template <name>
    gimme create --template ./path/to/template

This commands creates a new project using given `template`.

The create command will prompt for various information about the project
to create, all of these can be overriden by passing in the appropriate
cli option, eg. `--name` to skip name prompt.

* **name** Project name. The name will be used to create a new
  directroy, relative to the current working one.

* **description** Optional description.

Templates
---------

Templates are defined by dropping some folder into the
`~/.gimme/template` one.

In order to be properly loaded as a template by `gimme`, they need to
follow the following convention.

* have a valid package.json file
* with a `gimme` property.
* have a `main` entry point, which points to a valid node module.

The entry point should expose an object with the following properties / methods

* **init** called on startup, with the app object.
* **handle** called after the prompts with the resulting data, merged
  with `package.json`'s data.

The module should expose a simple object, in which case `gimme` creates
a new `Template` object for you.

### Example

    var template = module.exports;
    template.init = function(app, cb) {
      this.app = app;

      var data = app.get('data'),
        self = this,
        name = data.name;

      app.info('init', data);
      this.on('error', cb);
      this.spawn('express ' + name, function(e) {
        if(e) return self.emit('error', e);
        app.info('express bootstrap ok');
        self.emit('ready');
        cb && cb();
      });
    };

    template.handle = function(data, cb) {
      app.warn(data);
      var self = this;

      this.copyFiles(data, function(e) {
        if(e) return self.emit('error', e);
        self.emit('end');
      });
    };

Configuration
-------------

### template

* Type: String

The project template, this must match one of the template in
`~/.gimme/templates`.

