'use strict';

var gulp = require('gulp');
var minify = require('gulp-minify');
var uglify = require('gulp-uglify');
var browserSync = require('browser-sync');

var options = {
    port: 8080,
    open: true, //open in Browser
    reloadOnRestart: true,
    logFileChanges: true,
    server:{
        baseDir: ['./']
    }
}

var reload = browserSync.reload;

var filesToWatch = [
    './assets/js/list-search.js',
    './app.css',
    './index.html'
]

var scriptDestFolder = './js';

gulp.task('scripts', function(){
    return gulp
        .src('./assets/js/list-search.js')
        .pipe(minify())
        .pipe(uglify())
        .pipe(gulp.dest(scriptDestFolder));
});

gulp.task('serve', function(){
    browserSync(options);
    gulp.watch(filesToWatch, ['scripts']).on('change', reload);
});
