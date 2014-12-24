'use strict';

var fs = require('fs'),
	str = require('../str'),
	expect = require('chai').expect;

describe('str lib', function() {
	// @todo Remove or add tests.

	it('str.quote', function() {
		expect(str.quote('"', 'test')).to.equal('"test"');
		expect(str.quote('\'', 'test2')).to.equal('\'test2\'');
	});
});
