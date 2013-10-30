/**
 * Parser of gruntfiles, can be used for adding, deleting and updating grunt tasks
 * 
 * @author Alexander Burtsev
 * @license MIT
 */

'use strict';

var	fs = require('fs'),
	path = require('path'),
	esprima = require('esprima');

/**
 * Entry point, main class for patching gruntfile
 * @class
 * @name Gruntfile
 * @param {String} [filename=Gruntfile.js] Path to Gruntfile.js
 */
function Gruntfile(file) {
	this.file = file || 'Gruntfile.js';

	if ( !fs.existsSync(this.file) )
		throw new Error('File does not exists');

	this.source = fs.readFileSync(this.file, 'utf8');
	this.tree = esprima.parse(this.source);
	this.parse();
}

Gruntfile.prototype = {
	defaultJS: 'Gruntfile.js',
	defaultCoffee: 'Gruntfile.coffee',

	parse: function() {
		// @todo
	}
};

module.exports = {
	Gruntfile: Gruntfile
};