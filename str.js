/**
 * Helper for string traversal and manipulation
 */
'use strict';

module.exports = {
	escapeRegExp: function(str) {
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	},

	/**
	 * Cuts start-end parentheses
	 * @param {String} Source str
	 * @return {String} 
	 */
	expressionCut: function(str) {
		var matched = str.match(/^\(([\s\S]*?)\);?$/m);
		if ( matched ) {
			return matched[1];
		}
		return str;
	},

	/**
	 * @ignore
	 * @tofix: ugly 
	 */
	findBefore: function(str, indexTo, terminator) {
		indexTo = indexTo || 0;
		terminator = terminator || '';
		str = (str || '').substring(0, indexTo);

		var re = new RegExp("(" + this.escapeRegExp(terminator) + "\\s+)$", 'gim'),
			matched = str.match(re);

		return matched ? matched[0].length : 0;
	},

	/**
	 * @ignore
	 * @tofix: ugly 
	 */
	findAfter: function(str, indexFrom, terminator) {
		indexFrom = indexFrom || 0;
		str = (str || '').substring(indexFrom);

		var re = new RegExp("^(\\s*)" + this.escapeRegExp(terminator), 'gim'),
			matched = str.match(re);

		return matched ? matched[0].length : 0;
	},

	/**
	 * Insert ```str``` into ```source``` by ```loc``` position
	 * @param {String} source Source string
	 * @param {Object} loc Object with line and column-based location info ```{ line: 11, column: 18 }```
	 * @param {String} str Inserted string
	 */
	insertIn: function(source, loc, str) {
		var line = loc.line - 1,
			column = loc.column - 1,
			targetLines = source.split('\n'),
			targetLine = targetLines[line],
			before, after;

		if ( targetLine !== undefined && targetLine.length >= column ) {
			before = targetLine.substring(0, column);
			after = targetLine.substring(column);
			targetLine = before + str + after;
			targetLines[line] = targetLine;
		}

		return targetLines.join('\n');
	}
};