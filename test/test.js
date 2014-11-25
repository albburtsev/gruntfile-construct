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
		expect(gruntfile.tree).to.be.a('object');
		expect(gruntfile.tree).to.be.a('object');
		expect(gruntfile.tree).to.have.property('type', 'Program');
	});

	it('Traversal: detect initConfig() call', function() {
		var gruntfile = new gfc.Gruntfile('test/original/gruntfile.#1.js');

		expect(gruntfile._initCall).to.be.a('object');
		expect(gruntfile._initCallPath).to.be.a('object');
		expect(gruntfile._initCall.loc.start.line).to.equal(11);
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

			expect(gruntfile.removeTask('jshint').buffer).to.equal(fileExpected);
		});
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

});
