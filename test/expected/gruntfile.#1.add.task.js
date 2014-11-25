module.exports = function(grunt) {
	'use strict';

	require('matchdep')
		.filterDev('grunt-*')
		.forEach(grunt.loadNpmTasks);

	/*
	 * Multiline comment
	 */
	grunt.initConfig({
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

		concat: {
			nonull: true,
			src: [
				'vendor/jquery.js',
				'js/main.js'
			],
			dest: 'build/scripts.js'
		}
	});

	grunt.registerTask('default', ['jshint', 'jscs', 'watch']);
};
