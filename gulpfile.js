var gulp = require('gulp');
const cssnano = require('gulp-cssnano');
const sass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const merge = require("merge-stream");

gulp.task('sass', function(){
    return gulp.src('app/scss/style.scss')
        .pipe(sass())
        .pipe(cssnano())
        .pipe(concat('vhc-signup-widget.min.css'))
        .pipe(gulp.dest('vhc-signup/css'));
});

gulp.task('js', function(){
    return gulp.src(['app/js/plugins/intlTelInput.min.js', 'app/js/plugins/slick.min.js', 'app/js/plugins/ejs.js', 'app/js/plugins/tooltip.js', 'app/js/plugins/popover.js', 'app/js/VzApp.js', 'app/js/regions.js', 'app/js/vhc-signup.js'])
        .pipe(concat('vhc-signup-widget.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('vhc-signup/js'));
});

// var images = [
//     './app/img/*.*',
//     './app/partial/*.*'
// ];
// gulp.task('distribute', function() {
//     return gulp.src(files)
//         .pipe(gulp.dest('dist'));
// });

gulp.task('copy-resources', function() {
    return merge([
        gulp.src('./app/img/*.*').pipe(gulp.dest('./vhc-signup/img')),
        gulp.src('./app/img/**/*.*').pipe(gulp.dest('./vhc-signup/img/')),
        gulp.src('./app/partial/*.ejs').pipe(gulp.dest('./vhc-signup/partial'))
    ]);
});

gulp.task('watch', function(){
    gulp.watch('app/scss/*.scss', gulp.series('sass'));
    gulp.watch('app/partial/*.ejs', gulp.series('copy-resources'));
    gulp.watch('app/js/*.js', gulp.series('js'));
});

gulp.task('default', gulp.series('sass', 'js', 'copy-resources', 'watch'));