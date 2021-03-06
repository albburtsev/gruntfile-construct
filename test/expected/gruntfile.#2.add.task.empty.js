module.exports = function(grunt) {
	'use strict';

	require('matchdep')
		.filterDev('grunt-*')
		.forEach(grunt.loadNpmTasks);

	/*
	 * Multiline comment
	 */
	var config = {
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
		},

		empty: {}
	};

	grunt.initConfig(config);

	grunt.registerTask('default', []);
};
