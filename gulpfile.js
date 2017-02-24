(function () {
  'use strict';

  var gulp = require('gulp');
  var inject = require('gulp-inject');
  var rename = require('gulp-rename');
  var browserSync = require('browser-sync').create();
  var eslint = require('gulp-eslint');
  var angularFilesort = require('gulp-angular-filesort');
  var nodemon = require('gulp-nodemon');
  var runSequence = require('run-sequence');

  var jsFrontEndFiles = [
    '!frontend/lib/**/*',
    'frontend/**/*.js'
  ];
  var jsBackEndFiles = 'backend/**/*.js';
  var cssFiles = [
    '!frontend/lib/**/*',
    'frontend/**/*.css'
  ];
  var htmlFiles = 'frontend/**/*.html';
  var indexTemplate = 'frontend/index.html.template';
  var lintFiles = [].concat([
    'gulpfile.js'
  ], jsFrontEndFiles, jsBackEndFiles);

  gulp.task('nodemon', function () {
    // Given that we're interacting with not sure if restarting the arduino interface often is healthy. Switch to
    // something other than nodemon to run server
    nodemon({
      script: 'backend/server.js',
      ignore: ['/'],
      env: {NODE_ENV: 'development'}
    });
  });

  gulp.task('watch', function () {
    browserSync.init({
      open: false,
      browser: ['chrome'],
      proxy: 'http://localhost:4100',
      port: 4101,
      ws: true,
      ghostMode: false
    });

    //TODO: V2 Create dist folder

    gulp.watch(jsFrontEndFiles, {interval: 1000, usePoll: true, verbose: true}, browserSync.reload);
    gulp.watch(cssFiles, browserSync.reload);
    gulp.watch(htmlFiles, browserSync.reload);
    gulp.watch(indexTemplate, ['index', browserSync.reload]);
  });

  gulp.task('lint', function () {
    return gulp.src(lintFiles)
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
  });

  gulp.task('index', function () {

    var wiredep = require('wiredep').stream;

    return gulp.src(indexTemplate)
      .pipe(inject(gulp.src(jsFrontEndFiles).pipe(angularFilesort()), {relative: true}))
      .pipe(inject(gulp.src(cssFiles), {relative: true, name: 'inject'}))
      .pipe(wiredep({}))
      .pipe(rename({
        basename: 'index',
        extname: '.html'
      }))
      .pipe(gulp.dest('frontend'));

  });

  gulp.task('default', function () {
    runSequence('index', 'lint', 'watch', 'nodemon');
  });
})();

