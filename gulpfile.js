'use strict';

const pkg = require('./package.json');
const gulp = require('gulp');
const mocha = require('gulp-mocha');
const sourcemaps = require('gulp-sourcemaps');

const builtDir = 'lib';
const testBuildDir = '.tmp';
const ts = require('gulp-typescript');

gulp.task('clean', function() {
  const del = require('del');
  del.sync([
    builtDir,
    testBuildDir,
    'daisyparser.js',
    'daisyparser.d.ts'
  ], {
    force: true
  });
});

gulp.task('lint', function() {
  const tslint = require('gulp-tslint');
  return gulp.src([
    'src/**/*.ts',
    'tests/**/.ts'
  ])
    .pipe(tslint())
    .pipe(tslint.report('verbose'));
});

gulp.task('tsc', ['lint'], function() {
  const tsProject = ts.createProject('tsconfig.json', {
    sortOutput: true,
    typescript: require('typescript')
  });

  const tsFiles = gulp.src([
    'src/**/*.ts',
    'references.d.ts'
  ])
    .pipe(sourcemaps.init())
    .pipe(ts(tsProject));

  const jsFiles = tsFiles.js
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./lib'));

  const dtsFiles = tsFiles.dts
    .pipe(gulp.dest('./lib'));

  return require('merge-stream')(jsFiles, dtsFiles);
});

gulp.task('build', [
  'clean',
  'lint',
  'tsc'
]);

gulp.task('test-build', ['build'], function() {
  const tsProject = ts.createProject('tests/tsconfig.json', {
    typescript: require('typescript')
  });

  return gulp.src([
    'libs/**/*.d.ts',
    'tests/**/*.ts',
    'references.d.ts'
  ])
    .pipe(ts(tsProject))
    .pipe(gulp.dest(testBuildDir));
});

gulp.task('test', ['test-build'], function() {
  return gulp.src(`${testBuildDir}/**/*.js`)
    .pipe(mocha({
      require: ['source-map-support/register']
    }));
});

gulp.task('watch', ['test-build'], function() {
  gulp.watch([
    'tsconfig.json',
    'tslint.json',
    'src/**/*.ts',
    'tests/tsconfig.json',
    'tests/**/*.ts',
    'references.d.ts'
  ], ['test']);
});

// gulp.task('default', ['watch', 'build', 'test']);
