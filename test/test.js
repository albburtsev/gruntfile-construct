'use strict';

var fs = require('fs'),
	gfc = require('../gruntfile-construct'),
	expect = require('chai').expect;


describe('Handling errors', function() {

	it('Unexist gruntfile', function() {
		expect(function() {
			new gfc.Gruntfile('not.exist.js');
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
		expect(gruntfile.file).to.be.a('string');
		expect(gruntfile.source).to.be.a('string');
		expect(gruntfile.tree).to.be.a('object');
		expect(gruntfile.tree).to.be.a('object');
		expect(gruntfile.tree).to.have.property('type', 'Program');
	});

});