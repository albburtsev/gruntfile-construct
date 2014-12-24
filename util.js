/**
 * Helper for string traversal and manipulation
 */
'use strict';

module.exports = {
	/**
	 * Quotes string
	 * @param {String} quote Quote character
	 * @param {String} str String to quote
	 * @return {String}
	 */
	quote: function(quote, str) {
		return quote + str + quote;
	},

	/**
	 * Iterates parents for given path and returns needed
	 * @param {Object} path Source path
	 * @param {String} [parentType] Type of needed parent
	 */
	parentPath: function(path, parentType) {
		if ( !parentType ) {
			return path.parent;
		}

		while (path.parent) {
			path = path.parent;
			if ( path.node.type === parentType ) {
				return path;
			}
		}
	},

	/**
	 * Detects quotes style (" or ') used in a node
	 * @return {String}
	 */
	detectQuoteStyle: function(node) {
		return node.startToken.value.charAt(0);
	}
};
