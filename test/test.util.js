'use strict';

var util = require('../util'),
	fs = require('fs'),
	rocambole = require('rocambole'),
	types = require('ast-types'),
	expect = require('chai').expect;

describe('util lib', function() {

	it('util.quote', function() {
		expect(util.quote('"', 'test')).to.equal('"test"');
		expect(util.quote('\'', 'test2')).to.equal('\'test2\'');
	});

	it('util.detectQuoteStyle', function() {
		var js1 = '[\'jshint\', \'jscs\']',
			tree1 = rocambole.parse(js1);
		expect(util.detectQuoteStyle(tree1.body[0].expression.elements[0])).to.equal('\'');

		var js2 = '["jshint", "jscs"]',
			tree2 = rocambole.parse(js2);
		expect(util.detectQuoteStyle(tree2.body[0].expression.elements[0])).to.equal('"');
	});

	it('util.parentPath', function() {
		var js = fs.readFileSync('test/original/gruntfile.#1.js', 'utf8'),
			tree = rocambole.parse(js),
			thePath;
		types.visit(tree, {
			visitMemberExpression: function(path) {
				var node = path.node;
				if ( ( node.object.name === 'grunt' ) && ( node.property.name === 'initConfig' ) ) {
					thePath = path;
					return false;
				}
				this.traverse(path);
			}
		});
		var theParent = util.parentPath(thePath, 'FunctionExpression');

		expect(theParent.value.params[0].name).to.equal('grunt');
		expect(theParent.value.parent.type).to.equal('AssignmentExpression');
		expect(theParent.value.parent.left.property.name).to.equal('exports');
	});

});
