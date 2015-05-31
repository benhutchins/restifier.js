'use strict';

module.exports = function (grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    eslint: {
      options: {
        config: '.eslintrc',
        format: 'compact'
      },
      'default': {
        src: [
          'lib/**/*.js',
          'tests/**/*.js',
          'Gruntfile.js'
        ]
      }
    },

    browserify: {
      dist: {
        files: {
          'restifier.js': ['index.js'],
        }
      }
    },

    watch: {
      scripts: {
        files: ['lib/**/*.js'],
        tasks: ['build'],
        options: {
          spawn: false,
        },
      },
    },

  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-eslint');

  // Assign task queues
  grunt.registerTask('verify', ['eslint']);
  grunt.registerTask('test', ['verify']);
  grunt.registerTask('build', ['browserify']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['test', 'build']);

};
