const gulp = require('gulp');
const gutil = require('gulp-util')
const concat = require('gulp-concat');
// var gzip = require('gulp-gzip');
const workboxBuild = require('workbox-build');
const imagemin = require('gulp-imagemin');


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
    gulp.watch(['js/restaurant_info.js'], ['script-restaurant'])
    gulp.watch(['js/*.js'], ['script-restaurant'])
    gulp.watch(['js/*.js'], ['script-main'])
    gulp.watch(['index.js'], ['server:restart'])

})


gulp.task('script-main', function () {
    return gulp.src(['js/idb-lib.js','js/restaurant-idb.js', 'js/dbhelper.js', 'js/main.js'])
        .pipe(concat('main.js'))
        .pipe(gulp.dest('./dist/'));
});
gulp.task('script-restaurant', function () {
    return gulp.src(['js/idb-lib.js',
                     'js/restaurant-idb.js',
                     'js/dbhelper.js',
                     'js/restaurant_info.js',
                     'js/review_form.js'])
        .pipe(concat('restaurant_info.js'))
        .pipe(gulp.dest('./dist/'));
});

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
// gulp.task("webpack-rest", function (callback) {
//     // run webpack
//     gutil.log("[webpack]")
//     webpack(
//         {
//             entry: './js/restaurant-idb.js',
//             output: {
//                 path: path.resolve(__dirname, 'dist'),
//                 filename: 'restaurant-idb.bundle.js'
//             }
//     }
//     , function (err, stats) {
//         if (err) throw new gutil.PluginError("webpack", err);
//         gutil.log("[webpack]", stats.toString({
//             // output options
//         }));
//         callback();
//     });
// });


gulp.task('service-worker', () => {
    return workboxBuild.injectManifest({
        swSrc: 'sw.js',
        swDest: 'dist/sw.js',
        globDirectory: 'dist',
        globPatterns: [
            '**\/*.{js,css,html}',
        ]
    }).then(({ count, size, warnings }) => {
        // Optionally, log any warnings and details.
        warnings.forEach(console.warn);
        console.log(`${count} files will be precached, totaling ${size} bytes.`);
    });
});


// gulp.task('imagemin', () =>
//     gulp.src('img/*')
//         .pipe(imagemin([
//             imagemin.gifsicle({ interlaced: true }),
//             imagemin.jpegtran({ progressive: true }),
//             imagemin.optipng({ optimizationLevel: 5 }),
//             imagemin.svgo({
//                 plugins: [
//                     { removeViewBox: true },
//                     { cleanupIDs: false }
//                 ]
//             })
//         ]))
//         .pipe(gulp.dest('dist/img'))
// );


const webp = require('gulp-webp');

gulp.task('imagemin', () =>
    gulp.src('img/*')
        .pipe(webp())
        .pipe(gulp.dest('dist/images'))
);

// Concatenation of the build process to make it available into npm
gulp.task('serve', function (callback) {
    runSequence('server:start', 'webpack', 'script-main', 'script-restaurant','imagemin', 'watch', callback);
});