module.exports = function(grunt) {
	'use strict';

	require('matchdep')
		.filterDev('grunt-*')
		.forEach(grunt.loadNpmTasks);

	/*
	 * Multiline comment
	 */
	grunt.initConfig({
		empty: {},
		// comment
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			files: ['**/*.js'],
		},

		jscs: {
			files: ['<%= jshint.files %>']
		},

		watch: {
			app: {
				files: ['<%= jshint.files %>'],
				tasks: ['jshint', 'jscs']
			}
		}
	});

	grunt.registerTask('default', ['jshint', 'jscs', 'watch']);
};
