/**
 * Parser of gruntfiles, can be used for adding, deleting and updating grunt tasks
 *
 * @author Alexander Burtsev
 * @license MIT
 */

'use strict';

var	_ = require('lodash'),
	_str = require('underscore.string'),
	fs = require('fs'),
	str = require('./str'),
	path = require('path'),
	stringifyObject = require('stringify-object'),
	rocambole = require('rocambole'),
	tk = require('rocambole-token'),
	types = require('ast-types'),
	namedTypes = types.namedTypes,
	visit = types.visit,
	detectIndent = require('detect-indent');

/**
 * Entry point, main class for patching gruntfile
 * @class
 * @name Gruntfile
 * @param {String} [file=Gruntfile.js] Path to Gruntfile.js
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

	// Detect source file indentation
	this.indent = detectIndent(this.source).indent || '\t';

	// Run AST parser
	this.parse();

	// Fetch existing tasks
	this.getTasks();
}

Gruntfile.prototype =
/** @lends Gruntfile.prototype */
{
	/** @property {String} defaultJS Default path to JavaScript grunt-file */
	defaultJS: 'Gruntfile.js',

	/**
	 * Adds task if it not exist
	 * @param {String} task Task name
	 * @param {Object} [config] Task config
	 * @returns {Gruntfile} Returns Gruntfile object
	 */
	addTask: function (task, config) {
		// @todo Quote task name if needed.
		// @todo Do not insert comma to empty properties list.

		if ( !_.isString(task) || this.tasks[task] ) {
			return this;
		}

		if ( config === undefined ) {
			config = {};
		}

		if ( !_.isString(config) ) {
			config = stringifyObject(config, {
				indent: this.indent,
				singleQuotes: true
			});
		}

		var props = this._configObject.properties,
			lastProp = props[props.length - 1];

		// Indent block
		var level = lastProp.endToken.loc.start.column,
			blockIndent = _str.repeat(this.indent, level);
		config = blockIndent + config.replace(/\n/g, '\n' + blockIndent);

		var configExpression = '({' + task + ': ' + config + '})',  // @todo Simplify?
			configTree = rocambole.parse(configExpression, {
				loc: true
			}),
			newProp = configTree.body[0].expression.properties[0];

		// Append new property
		var prefix = {
			value: ',\n\n' + blockIndent + task + ': '
		};
		tk.after(lastProp.endToken, prefix);
		tk.after(prefix, newProp);

		// Save results
		if ( this.autosave ) {
			this.save();
		}

		this.reparse();
		return this;
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
				range[0] - str.findBefore(this.source, range[0], '\n'),
				range[1] + str.findAfter(this.source, range[1], ',')
			);

		// @todo: ugly and unsafe, fix replace in favor of positioned slice
		this.buffer = this.source.replace(taskSubstr, '');

		if ( this.autosave ) {
			this.save();
		}

		this.reparse();
		return this;
	},

	/**
	 * Registers a task: adds list of tasks to `grunt.registerTask` with specifiend task `name`.
	 * @param {String} name Task name
	 * @param {Array} tasks Taks list
	 * @returns {Gruntfile} Returns Gruntfile object
	 */
	registerTask: function(name, tasks) {
		if ( !_.isArray(tasks) ) {
			tasks = [tasks];
		}

		var expression;
		visit(this.tree, {
			visitMemberExpression: function(path) {
				var node = path.node;
				if ( node.object.name === 'grunt' && node.property.name === 'registerTask' &&
						node.parent.arguments && node.parent.arguments[0].value === name ) {
					expression = node.parent;
				}
				this.traverse(path);
			}
		});

		if (expression) {
			// Task group already exists
			var list = expression.arguments[1];
			if ( !list ) {
				throw new Error('grunt.registerTask requires second argument');
			}
			list = list.elements;

			// Filter already existent items
			var existentTasks = _.map(list, 'value');
			tasks = _.filter(tasks, function(taskName) {
				return existentTasks.indexOf(taskName) === -1;
			});

			if ( !tasks.length ) {
				// All tasks already existent
				return this;
			}

			// Append new items
			var quote = this.detectQuoteStyle(list[0]),
				items = _.map(tasks, str.quote.bind(str, quote)),
				newToken = {
					value: ', ' + items.join(', ')
				};
			tk.after(list[list.length - 1].endToken, newToken);
		}
		else {
			// @todo
		}

		this.reparse();
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

		visit(this.tree, {
			visitMemberExpression: function(path) {
				var node = path.node;
				if ( ( node.object.name === 'grunt' ) && ( node.property.name === 'initConfig' ) ) {
					initCalls.push([node, path]);
				}
				this.traverse(path);
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
			visit(this.tree, {
				visitIdentifier: function(path) {
					var node = path.node;
					if ( node.name === configObject.name ) {
						if ( namedTypes.VariableDeclarator.check(node.parent) ) {
							configObject = node.parent.init;
							return false;
						}
					}
					this.traverse(path);
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
	 * Detects quotes style (" or ') used in a node
	 */
	detectQuoteStyle: function(node) {
		return node.startToken.value.charAt(0);
	},

	/**
	 * @ignore
	 * AST parser of source grunt-file
	 */
	parse: function() {
		this.tree = rocambole.parse(this.source, {
			loc: true
		});

		this.detectInitCall();
		this.detectConfig();
	},

	/**
	 * @ignore
	 * Regenerates AST from modified source code
	 */
	reparse: function() {
		this.source = this.code();
		this.parse();
	},

	/**
	 * Returns modified source code.
	 * @return {String}
	 */
	code: function() {
		return this.tree.toString();
	},

	/**
	 * @ignore
	 * Saves injected grunt-file
	 * @param {String} [output] Path to output
	 */
	save: function(output) {
		output = output || this.output || this.file;
		fs.writeFileSync(output, this.code());
	}
};

module.exports = {
	Gruntfile: Gruntfile
};
