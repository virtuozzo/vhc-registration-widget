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
        .pipe(gulp.dest('vhc-signup/css'))
        .pipe(concat('vhc-products-signup-widget.min.css'))
        .pipe(gulp.dest('vhc-products-signup/css'))
        .pipe(concat('vhc-direct-signup-widget.min.css'))
        .pipe(gulp.dest('vhc-direct-signup/css'));
});

gulp.task('js', function(){
    return gulp.src(['app/js/plugins/intlTelInput.min.js', 'app/js/plugins/slick.min.js', 'app/js/plugins/ejs.js', 'app/js/plugins/tooltip.js', 'app/js/plugins/popover.js', 'app/js/VzApp.js', 'app/js/regions.js', 'app/js/vhc-signup.js'])
        .pipe(concat('vhc-signup-widget.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('vhc-signup/js'));
});
gulp.task('products-js', function(){
    return gulp.src(['app/js/plugins/intlTelInput.min.js', 'app/js/plugins/slick.min.js', 'app/js/plugins/ejs.js', 'app/js/plugins/tooltip.js', 'app/js/plugins/popover.js', 'app/js/VzApp.js', 'app/js/regions.js', 'products/js/vhc-signup.js'])
        .pipe(concat('vhc-products-signup-widget.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('vhc-products-signup/js'));
});
gulp.task('direct-js', function(){
    return gulp.src(['app/js/plugins/intlTelInput.min.js', 'app/js/plugins/slick.min.js', 'app/js/plugins/ejs.js', 'app/js/plugins/tooltip.js', 'app/js/plugins/popover.js', 'app/js/VzApp.js', 'app/js/regions.js', 'virtuozzo-direct/js/vhc-signup.js'])
        .pipe(concat('vhc-direct-signup-widget.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('vhc-direct-signup/js'));
});

gulp.task('copy-resources', function() {
    return merge([
        gulp.src('./app/img/*.*').pipe(gulp.dest('./vhc-signup/img')).pipe(gulp.dest('./vhc-products-signup/img')).pipe(gulp.dest('./vhc-direct-signup/img')),
        gulp.src('./app/img/**/*.*').pipe(gulp.dest('./vhc-signup/img/')).pipe(gulp.dest('./vhc-products-signup/img/')).pipe(gulp.dest('./vhc-direct-signup/img/')),
        gulp.src('./app/partial/*.ejs').pipe(gulp.dest('./vhc-signup/partial')),
        gulp.src('./products/partial/*.ejs').pipe(gulp.dest('./vhc-products-signup/partial')),
        gulp.src('./virtuozzo-direct/partial/*.ejs').pipe(gulp.dest('./vhc-direct-signup/partial')),
        gulp.src('./app/js/plugins/*.js').pipe(gulp.dest('./vhc-signup/js/plugins')).pipe(gulp.dest('./vhc-products-signup/js/plugins')).pipe(gulp.dest('./vhc-direct-signup/js/plugins'))
    ]);
});

gulp.task('watch', function(){
    gulp.watch('app/scss/*.scss', gulp.series('sass'));
    gulp.watch('app/partial/*.ejs', gulp.series('copy-resources'));
    gulp.watch('products/partial/*.ejs', gulp.series('copy-resources'));
    gulp.watch('virtuozzo-direct/partial/*.ejs', gulp.series('copy-resources'));
    gulp.watch('app/js/*.js', gulp.series('js'));
    gulp.watch('products/js/*.js', gulp.series('products-js'));
    gulp.watch('virtuozzo-direct/js/*.js', gulp.series('direct-js'));
});

gulp.task('default', gulp.series('sass', 'js', 'products-js', 'direct-js', 'copy-resources', 'watch'));