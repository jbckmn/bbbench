module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      general: {
        options: {
          banner: '/*! <%= pkg.name %> v<%= pkg.version %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
          mangle: {
            except: ['bbbench']
          }
        },
        files: {
          'public/javascripts/bbbench.min.js': ['public/javascripts/classie.js', 'public/javascripts/lodash.js', 'public/javascripts/lodash-ext.js', 'public/javascripts/script.js', 'public/javascripts/user.js', 'public/javascripts/bench.js']
        }
      }
    },
    jshint: {
      files: ['gruntfile.js', 'public/javascripts/bench.js', 'public/javascripts/user.js', 'public/javascripts/script.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        }
      }
    },
    cssmin: {
      add_banner: {
        options: {
          banner: '/*! <%= pkg.name %> v<%= pkg.version %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
        },
        files: {
          'public/stylesheets/bbbench.min.css': ['public/stylesheets/pure-min.css', 'public/stylesheets/icons.css', 'public/stylesheets/style.css']
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'uglify']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  grunt.registerTask('test', ['jshint']);

  grunt.registerTask('crush', ['uglify', 'cssmin']);

  grunt.registerTask('default', ['jshint', 'uglify', 'cssmin']);
};
