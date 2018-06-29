const gulp = require('gulp');
const gutil = require('gulp-util')
const developServer = require('gulp-develop-server');
const webpack = require("webpack");
const path = require('path');
// const bs = require('browser-sync');
const runSequence = require('run-sequence');


gulp.task('server:start', function () {
    // run server
    developServer.listen({
        path: './index.js',
    });
    
});

gulp.task('server:restart', function() {
    console.log('server-restart')
    developServer.restart()
})


gulp.task('watch', function() {
    gulp.watch(['js/idb.js'], ['webpack'])
    gulp.watch(['js/**.js'], ['server:restart'])
    gulp.watch(['index.js'], ['server:restart'])

})



gulp.task("webpack", function (callback) {
    // run webpack
    gutil.log("[webpack]")
    webpack(
        {
            entry: './js/idb.js',
            output: {
                path: path.resolve(__dirname, 'dist'),
                filename: 'idb-bundle.js'
        }
    }
    , function (err, stats) {
        if (err) throw new gutil.PluginError("webpack", err);
        gutil.log("[webpack]", stats.toString({
            // output options
        }));
        callback();
    });
});


// Concatenation of the build process to make it available into npm
gulp.task('serve', function (callback) {
    runSequence('server:start','webpack','watch', callback);
});