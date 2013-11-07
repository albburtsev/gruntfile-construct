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
	escodegen = require('escodegen'),
	jsonpath = require('JSONPath').eval;

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
		output: null,

		_initCall: null, // JSON
		_initCallPath: '' // JSONPath
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
			loc: true
		});

		this.detectInitCall();
	},

	/**
	 * Detects invocation of method ```grunt.initConfig()```
	 * @see [JSONPath](http://goessner.net/articles/JsonPath/)
	 */
	detectInitCall: function() {
		var	treeProperties = jsonpath(this.tree, '$..property'),
			treePropertiesPath = jsonpath(this.tree, '$..property', { resultType: 'PATH' }),
			initCalls = [];

		for (var i = treeProperties.length, property; i--;) {
			property = treeProperties[i];
			if ( property.name === 'initConfig' ) {
				initCalls.push([property, treePropertiesPath[i]]);
			}
		}

		if ( !initCalls.length ) {
			throw new Error('Invocation of initConfig() not found');
		}

		if ( initCalls.length > 1 ) {
			throw new Error('Too many invocations of initConfig()');
		}

		this._initCall = initCalls[0][0];
		this._initCallPath = initCalls[0][1];
	},

	/**
	 * @ignore
	 * Recursive search in AST (unused)
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
				var found = true;
				_.each(fields, function(fieldValue, fieldKey) {
					if ( nestedValue[fieldKey] !== fieldValue )
						found = false;
				});

				if ( found ) {
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