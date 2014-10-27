var gulp = require('gulp')
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
    var opts = {
        entries: ['./lib']
    }
    var b = browserify(opts)
    b.require('./lib',{expose: 'ioc'})
    return b.bundle()
        .pipe(vinyl('bundle.js'))
        .pipe(gulp.dest('./build'))
})


gulp.task('test',[],function(){
    var specFiles = './test/*-spec.js'
    var tests = glob.sync(specFiles)
    tests.unshift('./test/spec-support.js')
    var opts = {
        entries: tests
        ,debug: true
    }
    var b = browserify(opts)
    return b.bundle()
        .pipe(vinyl('specs.js'))
        .pipe(gulp.dest('./build'))

})

// Helper method to kill the gulp task on error
gulp.fail = function(err) {
    console.log(err)
    process.exit(1)
}
