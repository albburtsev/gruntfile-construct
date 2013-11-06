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

	if ( !fs.existsSync(file) )
		throw new Error('File does not exists');

	// Merge options
	_.extend(this, {
		file: file,
		source: fs.readFileSync(file, 'utf8'),
		output: null
	}, opts || {});

	// Run parser
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
	},

	/**
	 * Saves injected grunt-file
	 * @param {String} [output] Path to output
	 */
	save: function(output) {
		output = output || this.output || this.file;

		/*
		this.tree = escodegen.attachComments(this.tree, this.tree.comments, this.tree.tokens);
		var code = escodegen.generate(this.tree, {
			comment: true,
			format: {
				indent: {
					adjustMultilineComment: true
				}
			}
		});
		*/

		// @todo

		fs.writeFileSync(output, code);
	}
};

module.exports = {
	Gruntfile: Gruntfile
};