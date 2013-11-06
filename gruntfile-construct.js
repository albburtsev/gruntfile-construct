/**
 * Parser of gruntfiles, can be used for adding, deleting and updating grunt tasks
 * 
 * @author Alexander Burtsev
 * @license MIT
 */

'use strict';

var	_ = require('lodash'),
	fs = require('fs'),
	path = require('path'),
	esprima = require('esprima'),
	escodegen = require('escodegen');

/**
 * Entry point, main class for patching gruntfile
 * @class
 * @name Gruntfile
 * @param {String} [filename=Gruntfile.js] Path to Gruntfile.js
 * @param {Object} [opts] Options
 * @param {String} [opts.output] Path to output
 */
function Gruntfile(file, opts) {
	file = file || this.defaultJS;

	if ( !fs.existsSync(file) ) {
		throw new Error('File does not exists');
	}

	// Merge options
	_.extend(this, {
		file: file,
		source: fs.readFileSync(file, 'utf8'),
		output: null
	}, opts || {});

	// Run esprima parser
	this.parse();
}

Gruntfile.prototype =
/** @lends Gruntfile.prototype */ 
{
	/** @property {String} defaultJS Default path to JavaScript grunt-file */
	defaultJS: 'Gruntfile.js',
	/** @property {String} defaultCoffee Default path to CoffeeScript grunt-file */
	defaultCoffee: 'Gruntfile.coffee',

	/**
	 * Esprima parser of source grunt-file 
	 */
	parse: function() {
		this.tree = esprima.parse(this.source, {
			comment: true,
			range: true,
			loc: true,
			tokens: true
		});

		this.detectInitCall();
	},

	/**
	 * Detects invocation of method ```grunt.initConfig()```
	 */
	detectInitCall: function() {
		var initCalls = this.findObject('', {
			type: 'Identifier',
			name: 'initConfig'
		});

		if ( !initCalls.length ) {
			throw new Error('Invocation of initConfig() not found');
		}

		if ( initCalls.length > 1 ) {
			throw new Error('Too many invocations of initConfig()');
		}

		this.initCall = initCalls[0];
	},

	/**
	 * Recursive search in AST
	 * @param {String} [key] Key for search
	 * @param {Object} [fields] Hash with fields for search
	 */
	findObject: function(key, fields, tree, result) {
		// @todo: http://goessner.net/articles/JsonPath/

		tree = tree || this.tree;
		result = result || [];

		if ( !key && !fields ) {
			return result;
		}

		_.each(tree, function(nestedValue, nestedKey) {
			// Nested value is not object
			if ( !_.isObject(nestedValue) ) {
				return;
			}

			// Nested value is element of array
			if ( !nestedKey ) {
				this.findObject(key, fields, nestedValue, result);

			// Nested value is real object
			} else {
				if ( key && nestedKey !== key ) {
					this.findObject(key, fields, nestedValue, result);
				}

				// Comparison with given fields
				var finded = true;
				_.each(fields, function(fieldValue, fieldKey) {
					if ( nestedValue[fieldKey] !== fieldValue )
						finded = false;
				});

				if ( finded ) {
					result.push(nestedValue);
				} else {
					this.findObject(key, fields, nestedValue, result);
				}
			}
		}.bind(this));

		return result;
	},

	/**
	 * Saves injected grunt-file
	 * @param {String} [output] Path to output
	 */
	save: function(output) {
		output = output || this.output || this.file;

		// @todo

		fs.writeFileSync(output, code);
	}
};

module.exports = {
	Gruntfile: Gruntfile
};