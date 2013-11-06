# gruntfile-construct [![Build Status](https://secure.travis-ci.org/albburtsev/gruntfile-construct.png?branch=master)](https://travis-ci.org/albburtsev/gruntfile-construct)

Parser of gruntfiles, can be used for adding, deleting and updating grunt tasks.

## Usage

Install the module with npm:

```bash
npm install gruntfile-construct
```

Include the module in your script and use it:

```js
var gfc = require('gruntfile-construct');
var	gruntfile = new gfc.Grintfile('/path/to/Gruntfile.js');

// example #1
gruntfile.addTask('concat');
gruntfile.addSubTask('concat', 'styles', {
	files: ['/path/to/styles/*.css'],
	dest: 'build/styles.css'
});

// or example #2
gruntfile.addTask('concat', {
	styles: {
		files: ['/path/to/styles/*.css'],
		dest: 'build/styles.css'
	}
});

```

__Important!__ Your gruntfile must include config section and call ```initConfig()```.

## API Reference

### Class Grintfile([pathToGruntfile])

### Grintfile::addTask(task, [config], watchTask)

### Grintfile::removeTask(task)

### Grintfile::updateTask(task, [config], watchTask)

### Grintfile::addSubTask(task, subTask, [config], watchTask)

### Grintfile::removeTaskSubTask(task, subTask)

### Grintfile::updateSubTask(task, subTask, [config], watchTask)

### Grintfile::registerTask(name, [tasks])

### Grintfile::injectMatchdeps()