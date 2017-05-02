let gulp   = require('gulp'),
    sass   = require('gulp-sass'),
    uglify = require('gulp-uglify'),
    babel  = require('gulp-babel'),
    wrap   = require("gulp-wrap-file");

// ----------------------------------------------------

const DEV   = './dev/';
const BUILD = './build/';

// ----------------------------------------------------

gulp.task('build', ['build:manifest', 'build:copy-img', 'build:js', 'build:styles']);

// ----------------------------------------------------

gulp.task('build:manifest', () =>
    gulp.src(DEV + 'manifest.json')
        .pipe(gulp.dest(BUILD))
);

gulp.task('build:copy-img', () =>
    gulp.src(DEV + 'img/*.png')
        .pipe(gulp.dest(BUILD + 'img'))
);

gulp.task('build:js', () =>
    gulp.src(DEV + 'js/*.js')
        .pipe(wrap({wrapper: '(()=>{ {file} })();'}))
        .pipe(babel({presets: ['es2015']}))
        .pipe(uglify({mangle: true}))
        .pipe(gulp.dest(BUILD + 'js'))
);

gulp.task('build:styles', function(){
    gulp.src(DEV + 'css/*.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(gulp.dest(BUILD + 'css'));
});