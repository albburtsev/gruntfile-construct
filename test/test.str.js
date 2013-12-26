'use strict';

var fs = require('fs'),
	str = require('../str'),
	expect = require('chai').expect;

describe('str lib', function() {

	it('str.expressionCut', function() {
		expect(str.expressionCut).to.be.a('function');
		expect(str.expressionCut('({})')).to.equal('{}');
		expect(str.expressionCut('({});')).to.equal('{}');
		expect(str.expressionCut('({ a: 1\nb: 2 });')).to.equal('{ a: 1\nb: 2 }');
	});

	it('str.insertIn', function() {
		expect(str.insertIn).to.be.a('function');
		expect(str.insertIn('b', { line: 1, column: 1 }, 'a')).to.equal('ab');
		expect(str.insertIn('abef', { line: 1, column: 3 }, 'cd')).to.equal('abcdef');
		expect(str.insertIn('aa\ncc', { line: 2, column: 1 }, 'bb\n')).to.equal('aa\nbb\ncc');
	});

});