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
	types = require('ast-types'),
	namedTypes = types.namedTypes,
	traverse = types.traverse;

/**
 * Entry point, main class for patching gruntfile
 * @class
 * @name Gruntfile
 * @param {String} [filename=Gruntfile.js] Path to Gruntfile.js
 * @param {Object} [opts] Options
 * @param {String} [opts.output] Path to output
 * @param {Boolean} [opts.autosave=true] Auto save after either changing
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
		buffer: '',
		output: null,
		tasks: {},
		autosave: true,

		_initCall: null, // part of AST, JSON
		_initCallPath: '',
		_configObject: null, // part of AST, JSON
		_configObjectPath: ''
	}, opts || {});

	this.buffer = this.source;

	// Run esprima parser
	this.parse();

	// Fetch existing tasks
	this.getTasks();
}

Gruntfile.prototype =
/** @lends Gruntfile.prototype */ 
{
	/** @property {String} defaultJS Default path to JavaScript grunt-file */
	defaultJS: 'Gruntfile.js',
	/** @property {String} defaultCoffee Default path to CoffeeScript grunt-file */
	defaultCoffee: 'Gruntfile.coffee',

	/**
	 * @ignore
	 */
	strEscapeRegExp: function(str) {
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	},

	/**
	 * @ignore 
	 */
	strFindBefore: function(str, indexTo, terminator) {
		indexTo = indexTo || 0;
		terminator = terminator || '';
		str = (str || '').substring(0, indexTo);

		var re = new RegExp("(" + this.strEscapeRegExp(terminator) + "\\s+)$", 'gim'),
			matched = str.match(re);

		return matched ? matched[0].length : 0;
	},

	/**
	 * @ignore
	 */
	strFindAfter: function(str, indexFrom, terminator) {
		indexFrom = indexFrom || 0;
		str = (str || '').substring(indexFrom);

		var re = new RegExp("^(\\s*)" + this.strEscapeRegExp(terminator), 'gim'),
			matched = str.match(re);

		return matched ? matched[0].length : 0;
	},

	/**
	 * Removes given task from config
	 * @param {String} task Task name
	 * @returns {Gruntfile} Returns Gruntfile object
	 */
	removeTask: function(task) {
		var taskObj = task ? this.tasks[task] : null;

		if ( !taskObj ) {
			return this;
		}

		var	range = taskObj.node.range,
			taskSubstr = this.source.substring(
				range[0] - this.strFindBefore(this.source, range[0], '\n'),
				range[1] + this.strFindAfter(this.source, range[1], ',')
			);

		// @todo: ugly and unsafe, fix replace in favor of positioned slice
		this.buffer = this.source.replace(taskSubstr, '');

		if ( this.autosave ) {
			this.save();
		}
		
		return this;
	},

	/**
	 * @ignore
	 * Get tasks from config object
	 */
	getTasks: function() {
		if ( !namedTypes.ObjectExpression.check(this._configObject) ) {
			throw new Error('Unknown type of config object');
		}

		_.each(this._configObject.properties, function(task, key) {
			this.tasks[task.key.name] = {
				node: task,
				subtasks: []
			};
		}, this);
	},

	/**
	 * @ignore
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
	 * @ignore
	 * Detects config object (traversal AST)
	 */
	detectConfig: function() {
		var callExpressionPath = this.parentPath(this._initCallPath, 'CallExpression'),
			callExpression = callExpressionPath.node;

		if ( !callExpression.arguments || !callExpression.arguments.length ) {
			throw new Error('AST traversal error, arguments of initConfig() not found');
		}

		var configObject = callExpression.arguments[0];

		// All right
		if ( namedTypes.ObjectExpression.check(configObject) ) {
			// Do nothing

		// Finds ObjectExpression for given Identifier
		} else if ( namedTypes.Identifier.check(configObject) ) {
			traverse(this.tree, function(node) {
				if ( namedTypes.Identifier.check(node) && node.name === configObject.name ) {
					var parentNode = this.parent.node;
					if ( namedTypes.VariableDeclarator.check(parentNode) ) {
						configObject = parentNode.init;
						return false;
					}
				}
			});
		}

		this._configObject = configObject;
	},

	/**
	 * @ignore
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
	 * @ignore
	 * Esprima parser of source grunt-file 
	 */
	parse: function() {
		this.tree = esprima.parse(this.source, {
			comment: true,
			range: true,
			loc: true
		});

		this.detectInitCall();
		this.detectConfig();
	},

	/**
	 * @ignore
	 * Saves injected grunt-file
	 * @param {String} [output] Path to output
	 */
	save: function(output) {
		output = output || this.output || this.file;
		fs.writeFileSync(output, this.buffer);
	}
};

module.exports = {
	Gruntfile: Gruntfile
};