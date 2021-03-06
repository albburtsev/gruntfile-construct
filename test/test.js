'use strict';

var fs = require('fs'),
	glob = require('glob'),
	gfc = require('../gruntfile-construct'),
	expect = require('chai').expect;


describe('Handling errors', function() {

	it('Not existing gruntfile', function() {
		expect(function() {
			new gfc.Gruntfile('not.exists.js');
		}).to.throw(Error);
	});

	it('Invalid syntax', function() {
		expect(function() {
			new gfc.Gruntfile('test/original/invalid.syntax.js');
		}).to.throw(Error);
	});

});


describe('Correct parsing', function() {

	it('Correct parsing from esprima', function() {
		var gruntfile = new gfc.Gruntfile('test/original/gruntfile.#1.js');

		expect(gruntfile.file).to.be.a('string');
		expect(gruntfile.source).to.be.a('string');
		expect(gruntfile.tree).to.be.an('object');
		expect(gruntfile.tree).to.have.property('type', 'Program');
	});

	it('Traversal: detect initConfig() call', function() {
		var gruntfile = new gfc.Gruntfile('test/original/gruntfile.#1.js');

		expect(gruntfile._initCallPath).to.be.a('object');
		expect(gruntfile._initCallPath.value).to.be.a('object');
		expect(gruntfile._initCallPath.value.loc.start.line).to.equal(11);
	});

	it('Traversal: detect config object', function() {
		var gruntfile = new gfc.Gruntfile('test/original/gruntfile.#1.js'),
			gruntfile2 = new gfc.Gruntfile('test/original/gruntfile.#2.js');

		expect(gruntfile._configObject).to.be.a('object');
		expect(gruntfile._configObject.loc.start.line).to.equal(11);

		expect(gruntfile2._configObject).to.be.a('object');
		expect(gruntfile2._configObject.loc.start.line).to.equal(11);
	});

	it('Gruntfile without grunt.initConfig()', function() {
		expect(function() {
			new gfc.Gruntfile('test/original/without.gruntinit.js');
		}).to.throw(Error);
	});

	it('Gruntfile with several grunt.initConfig()', function() {
		expect(function() {
			new gfc.Gruntfile('test/original/several.gruntinit.js');
		}).to.throw(Error);
	});

	it('Gruntfile from a string', function() {
		var source = fs.readFileSync('test/original/gruntfile.#1.js', 'utf8'),
			gruntfile;

		expect(function() {
			gruntfile = new gfc.Gruntfile({ source: source });
		}).to.not.throw(Error);

		expect(gruntfile.source).to.be.a('string');
		expect(gruntfile.tree).to.be.an('object');
		expect(gruntfile.tree).to.have.property('type', 'Program');
	});

});


describe('Method removeTask()', function() {

	it('Correct removing', function() {
		var originalFiles = glob.sync('test/original/gruntfile.#*.js');

		originalFiles.forEach(function(filename) {
			var filenameExpected = filename
					.replace('original', 'expected')
					.replace('.js', '.remove.task.jshint.js'),
				fileExpected = fs.readFileSync(filenameExpected, 'utf8'),
				gruntfile = new gfc.Gruntfile(filename, { autosave: false });

			gruntfile.removeTask('jshint');

			expect(gruntfile.code()).to.equal(fileExpected);
		});
	});

	it('Correct removing: in memory', function() {
		var gruntfile = new gfc.Gruntfile({ source: fs.readFileSync('test/original/gruntfile.#1.js', 'utf8') }),
			fileExpected = fs.readFileSync('test/expected/gruntfile.#1.remove.task.jshint.js', 'utf8');

		gruntfile.removeTask('jshint');

		expect(gruntfile.code()).to.equal(fileExpected);
	});

});

describe('Method addTask()', function() {

	it('Correct adding empty task', function() {
		var originalFiles = glob.sync('test/original/gruntfile.#*.js');

		originalFiles.forEach(function(filename) {
			var filenameExpected = filename
					.replace('original', 'expected')
					.replace('.js', '.add.task.empty.js'),
				fileExpected = fs.readFileSync(filenameExpected, 'utf8'),
				gruntfile = new gfc.Gruntfile(filename, { autosave: false });

			gruntfile.addTask('empty');
			expect(gruntfile.code()).to.equal(fileExpected);
		});
	});

	it('Correct adding task', function() {
		var originalFiles = glob.sync('test/original/gruntfile.#*.js');

		originalFiles.forEach(function(filename) {
			var filenameExpected = filename
					.replace('original', 'expected')
					.replace('.js', '.add.task.js'),
				fileExpected = fs.readFileSync(filenameExpected, 'utf8'),
				gruntfile = new gfc.Gruntfile(filename, { autosave: false });

			var config = {
				nonull: true,
				src: [
					'vendor/jquery.js',
					'js/main.js'
				],
				dest: 'build/scripts.js'
			};

			gruntfile.addTask('concat', config);
			expect(gruntfile.code()).to.equal(fileExpected);
		});
	});

	it('Correct adding empty task: in memory', function() {
		var gruntfile = new gfc.Gruntfile({ source: fs.readFileSync('test/original/gruntfile.#1.js', 'utf8') }),
			fileExpected = fs.readFileSync('test/expected/gruntfile.#1.add.task.empty.js', 'utf8');

		gruntfile.addTask('empty');

		expect(gruntfile.code()).to.equal(fileExpected);
	});

});

describe('Method registerTask()', function() {

	it('Correctly adding task to alias', function() {
		var originalFiles = glob.sync('test/original/gruntfile.#*.js');

		originalFiles.forEach(function(filename) {
			var filenameExpected = filename
					.replace('original', 'expected')
					.replace('.js', '.register.task.js'),
				fileExpected = fs.readFileSync(filenameExpected, 'utf8'),
				gruntfile = new gfc.Gruntfile(filename, { autosave: false });

			gruntfile.registerTask('default', ['one', 'two']);
			gruntfile.registerTask('default', 'three');
			expect(gruntfile.code()).to.equal(fileExpected);
		});
	});

	it('Correct adding task to alias: in memory', function() {
		var gruntfile = new gfc.Gruntfile({ source: fs.readFileSync('test/original/gruntfile.#1.js', 'utf8') }),
			fileExpected = fs.readFileSync('test/expected/gruntfile.#1.register.task.js', 'utf8');

		gruntfile.registerTask('default', ['one', 'two']);
		gruntfile.registerTask('default', 'three');

		expect(gruntfile.code()).to.equal(fileExpected);
	});

});
