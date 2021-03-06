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
	util = require('./util'),
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
 * @param {String} [opts.dest] Path to output file
 * @param {String} [opts.source] Gruntfile code (won’t read it from a file)
 * @param {Boolean} [opts.autosave=true] Auto save after either changing
 */
function Gruntfile(file, opts) {
	// Options as a first argument
	if ( _.isObject(file) ) {
		opts = file;
		file = null;
	}

	file = file || this.defaultJS;

	opts = opts || {};
	_.extend(this, {
		source: null,
		file: file,
		dest: file,
		autosave: !opts.source
	}, opts);

	this.readSource();
	this.detectCodeStyle();
	this.parse();
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

		// We also need to remove extra whitespace and comma
		var next = taskObj.node.endToken.next;
		while ( next.type === 'Punctuator' || next.type === 'LineBreak' || next.type === 'WhiteSpace' ) {
			next = next.next;
		}
		var end = next.prev;

		// Remove everything
		tk.eachInBetween(taskObj.node.startToken, end, tk.remove);

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
			var listExpression = expression.arguments[1];
			if ( !listExpression ) {
				throw new Error('grunt.registerTask requires second argument');
			}
			var list = listExpression.elements;

			var items, newToken;
			if ( list.length ) {
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
				var quote = util.detectQuoteStyle(list[0]);
				items = _.map(tasks, util.quote.bind(util, quote));
				newToken = {
					value: ', ' + items.join(', ')
				};
				tk.after(list[list.length - 1].endToken, newToken);
			}
			else {
				// @todo Try to detect quotes somewhere else in a file.
				items = _.map(tasks, util.quote.bind(util, '\''));
				newToken = {
					value: items.join(', ')
				};
				tk.before(listExpression.endToken, newToken);
			}
		}
		else {
			// @todo
		}

		if ( this.autosave ) {
			this.save();
		}

		this.reparse();
		return this;
	},

	/**
	 * @ignore
	 * Get tasks from config object
	 */
	findTasks: function() {
		if ( !namedTypes.ObjectExpression.check(this._configObject) ) {
			throw new Error('Unknown type of config object');
		}

		this.tasks = {};
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
					initCalls.push(path);
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

		this._initCallPath = initCalls[0];
	},

	/**
	 * @ignore
	 * Detects config object (traversal AST)
	 */
	detectConfig: function() {
		var callExpressionPath = util.parentPath(this._initCallPath, 'CallExpression'),
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
	 * Reads source gruntfile
	 */
	readSource: function() {
		if ( !this.source ) {
			this.source = fs.readFileSync(this.file, 'utf8');
		}
	},

	/**
	 * @ignore
	 * Detects code style of the source file.
	 */
	detectCodeStyle: function() {
		this.indent = detectIndent(this.source).indent || '\t';
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
		this.findTasks();
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
	 * Saves injected grunt-file
	 * @param {String} [dest] Path to output file
	 */
	save: function(dest) {
		dest = dest || this.dest;
		fs.writeFileSync(dest, this.code());
	}
};

module.exports = {
	Gruntfile: Gruntfile
};
