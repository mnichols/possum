var gulp = require('gulp')
    , $ = require('gulp-load-plugins')()
    , browserify = require('browserify')
    , vinyl = require('vinyl-source-stream')
    , fs = require('fs')
    , glob = require('glob')
    , path = require('path')
    , url = require('url')
    , util = require('util')
    , mkdirp = require('mkdirp')
    ;


gulp.task('default',['build'])
gulp.task('build',[],function(){
    var b = browserify({
        entries: ['./lib']
    })
    b.require('./lib',{expose: 'ioc'})
    return b.bundle()
        .pipe(vinyl('bundle.js'))
        .pipe(gulp.dest('./build'))
})


gulp.task('test',[],function(){
    var specFiles = './test/*-spec.js'
    var tests = glob.sync(specFiles)
    tests.unshift('./test/spec-support.js')
    var b = browserify({
        entries: tests
    })
    return b.bundle({ debug: true })
        .pipe(vinyl('specs.js'))
        .pipe(gulp.dest('./build'))

})

// Helper method to kill the gulp task on error
gulp.fail = function(err) {
    console.log(err)
    process.exit(1)
}
