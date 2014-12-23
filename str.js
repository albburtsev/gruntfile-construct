/**
 * Helper for string traversal and manipulation
 */
'use strict';

module.exports = {
	escapeRegExp: function(str) {
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
	},

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
	 * @ignore
	 * @tofix: ugly
	 */
	findBefore: function(str, indexTo, terminator) {
		indexTo = indexTo || 0;
		terminator = terminator || '';
		str = (str || '').substring(0, indexTo);

		var re = new RegExp('(' + this.escapeRegExp(terminator) + '\\s+)$', 'gim'),
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

		var re = new RegExp('^(\\s*)' + this.escapeRegExp(terminator), 'gim'),
			matched = str.match(re);

		return matched ? matched[0].length : 0;
	}
};
