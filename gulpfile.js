/**
 * src: read files and directories and create a stream of data for further processing
 *      (which supports globbing and filters)
 * dest: take a directory and write the contents of the incoming streams as file
 *       (which, by default, overwrite existing files)
 * watch: automatically do all the processing tasks when a change happens in the code
 * parallel: start multiple functions concurrently
 * series: call functions one after the other
 */
const { src, dest, watch, parallel, series } = require('gulp');

// yarn add gulp-sass
const sass = require('gulp-sass');
const ejs = require('gulp-ejs');
const rename = require('gulp-rename');
const eslint = require('gulp-eslint');
const mocha = require('gulp-mocha');
const sync = require('browser-sync').create();
const uglify = require('gulp-uglify');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');

function generateCSS(cb) {
  // read .scss files from sass and pass its contents into the pipeline
  src('./sass/**/*.scss')
    // take the output of the previous command as pipe it as an input for next
    .pipe(sass().on('error', sass.logError))
    .pipe(sourcemaps.init())
    .pipe(autoprefixer())
    .pipe(sourcemaps.write())
    // write the output of the previous commands to the public/stylesheets directory
    .pipe(dest('public/stylesheets'))
    .pipe(sync.stream());
  cb();
}

// read *.ejs files
// pipe them into gulp-ejs ... replacing variables for the values provided
// pipe files into gulp-rename to change the file extension
// pipe everything into the public directory
function generateHTML(cb) {
  src('./views/index.ejs')
    .pipe(ejs({
      title: 'Hello World!'
    }))
    .pipe(rename({
      extname: '.html'
    }))
    .pipe(dest('public'));
  cb();
}

// run static code analysis and report the errors
function runLinter(cb) {
  return src(['**/*.js', '!build/**', '!node_modules/**'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .on('end', function() {
      cb();
    });
}

// capture the error event with .on('error') and 
// trigger the callback with an Error instance
function runTests(cb) {
  return src(['**/*.test.js'])
    .pipe(mocha())
    .on('error', function() {
      cb(new Error('Test failed'));
    })
    .on('end', function() {
      cb();
    });
}

// watch files and trigger the callback after the change
function watchFiles(cb) {
  watch('views/**.ejs', generateHTML);
  watch('sass/**.scss', generateCSS);
  watch(['**/*.js', '!node_modules/**'], parallel(runLinter, runTests));
}

// set up live reload on the browser
function browserSync(cb) {
  sync.init({
    server: {
      baseDir: './public'
    }
  });

  watch('views/**.ejs', generateHTML);
  watch('sass/**.scss', generateCSS);
  watch('./public/**.html')
    .on('change', sync.reload);
}

function uglifyJS(cb) {
  src(['**/*.js', '!build/**', '!node_modules/**'])
    .pipe(uglify())
    .pipe(dest('build'));
  cb();
}

exports.css = generateCSS;
exports.html = generateHTML;
exports.lint = runLinter;
exports.test = runTests;
exports.watch = watchFiles;
exports.sync = browserSync;
exports.uglify = uglifyJS;

exports.default = series(runLinter, parallel(generateCSS, generateHTML, uglifyJS), runTests);
