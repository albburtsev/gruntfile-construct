'use strict';

var fs = require('fs'),
	util = require('../util'),
	expect = require('chai').expect;

describe('util lib', function() {
	// @todo Remove or add tests.

	it('util.quote', function() {
		expect(util.quote('"', 'test')).to.equal('"test"');
		expect(util.quote('\'', 'test2')).to.equal('\'test2\'');
	});
});
