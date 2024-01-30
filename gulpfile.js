const gulp = require("gulp");
const ejs = require("gulp-ejs");
const rename = require("gulp-rename");

gulp.task("ejs", function () {
  return gulp
    .src("./views/pages/*.ejs")
    .pipe(ejs())
    .pipe(rename({ extname: ".html" }))
    .pipe(gulp.dest("./dist"));
});

gulp.task("default", gulp.series("ejs"));
