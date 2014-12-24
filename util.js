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
	}
};
