'use strict';

var fs = require('fs'),
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

	it('Correct properties of instance', function() {
		var gruntfile = new gfc.Gruntfile('test/original/gruntfile.#1.js');

		// Esprima parser
		expect(gruntfile.file).to.be.a('string');
		expect(gruntfile.source).to.be.a('string');
		expect(gruntfile.tree).to.be.a('object');
		expect(gruntfile.tree).to.be.a('object');
		expect(gruntfile.tree).to.have.property('type', 'Program');

		// Detects initConfig() call
		expect(gruntfile._initCall).to.be.a('object');
		expect(gruntfile._initCallPath).to.be.a('string');
		expect(gruntfile._initCall.loc.start.line).to.equal(11);
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