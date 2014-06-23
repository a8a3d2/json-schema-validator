'use strict';

var gulp = require('gulp');
var mocha = require('gulp-mocha');
var jshint = require('gulp-jshint');
var plumber = require('gulp-plumber');

/**
 * Mocha tests
 */
gulp.task('test', function (cb) {
  return gulp.src(['index.js'])
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .on('end', function () {
      gulp.src(['test/**/*.js'])
        .pipe(plumber())  
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(mocha({reporter: 'Dot'}))
        .on('end', cb);
    });
});

/**
 * CLI tasks
 */
gulp.task('default', ['test', 'watch']);