module.exports = function(grunt) {
	'use strict';

	require('matchdep')
		.filterDev('grunt-*')
		.forEach(grunt.loadNpmTasks);

	/*
	 * Multiline comment
	 */
	var config = {
concat: {
	nonull: true,
	src: [
		'vendor/jquery.js',
		'js/main.js'
	],
	dest: 'build/scripts.js'
},

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
	};

	grunt.initConfig(config);

	grunt.registerTask('default', ['jshint', 'jscs', 'watch']);
};
