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
	traverse = require('ast-types').traverse;

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

		_initCall: null, // part of AST, JSON
		_initCallPath: '',
		_configObject: null, // part of AST, JSON
		_configObjectPath: ''
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
		this.detectConfig();
	},

	/**
	 * Detects invocation of method ```grunt.initConfig()``` (traversal AST)
	 */
	detectInitCall: function() {
		var initCalls = [];

		traverse(this.tree, function(node) {
			if ( node.name === 'initConfig' ) {
				initCalls.push([node, this]);
			}
		});

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
	 * Detects config object (traversal AST)
	 */
	detectConfig: function() {
		var callExpressionPath = this.parentPath(this._initCallPath, 'CallExpression'),
			callExpression = callExpressionPath.node;

		if ( !callExpression.arguments || !callExpression.arguments.length ) {
			throw new Error('AST traversal error, arguments of initConfig() not found');
		}

		var configObject = callExpression.arguments[0];

		switch (configObject.type) {
			case 'ObjectExpression':
				// All right, do nothing
				break;

			case 'Identifier':
				// @todo
				break;

			default:
				throw new Error('Unknown type of config object');
				break;
		}

		this._configObject = configObject;
	},

	/**
	 * Iterates parents for given path and returns needed
	 * @param {Object} path Source path
	 * @param {String} [parent] Type of needed parent
	 */
	parentPath: function(path, parent) {
		if ( !parent ) {
			return path.parent;
		}

		while (path.parent) {
			path = path.parent;
			if ( path.node.type === parent ) {
				return path;
			}
		}
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