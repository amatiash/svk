let gulp   = require('gulp'),
    sass   = require('gulp-sass'),
    uglify = require('gulp-uglify'),
    babel  = require('gulp-babel'),
    wrap   = require("gulp-wrap-file");

// ----------------------------------------------------

const DEV   = './dev/';
const BUILD = './build/';

// ----------------------------------------------------

gulp.task('build', ['build:copy', 'build:js', 'build:styles']);

// ----------------------------------------------------

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

// ----------------------------------------------------

gulp.task('build:copy', ['build:copy-manifest', 'build:copy-img', 'build:copy-locales', 'build:copy-popup']);

gulp.task('build:copy-manifest', () =>
    gulp.src(DEV + 'manifest.json')
        .pipe(gulp.dest(BUILD))
);

gulp.task('build:copy-popup', () =>
    gulp.src(DEV + 'popup.html')
        .pipe(gulp.dest(BUILD))
);

gulp.task('build:copy-locales', () =>
    gulp.src(DEV + '_locales/**/*')
        .pipe(gulp.dest(BUILD + '_locales'))
);

gulp.task('build:copy-img', () =>
    gulp.src(DEV + 'img/*.png')
        .pipe(gulp.dest(BUILD + 'img'))
);

// ----------------------------------------------------