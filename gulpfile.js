'use strict';

const pkg = require('./package.json');
const gulp = require('gulp');
const mocha = require('gulp-mocha');
const sourcemaps = require('gulp-sourcemaps');

const builtDir = 'lib';
const testBuildDir = '.tmp';

const srcDir = 'src';
const testSrcDir = 'tests';

const fileGlobs = {
  'lib.d.ts': `${builtDir}/**/*.d.ts`,
  'src.ts': `${srcDir}/**/*.ts`,
  'test.ts': `${testSrcDir}/**/*.ts`,
  'test.build.js': `${testBuildDir}/**/*.js`,
  'refs': `references.d.ts`
};

const ts = require('gulp-typescript');
const typescript = require('typescript');
const tslint = require('gulp-tslint');
const del = require('del');
const mergeStream = require('merge-stream');

gulp.task('clean', function() {
  del.sync([
    builtDir,
    testBuildDir,
  ], {
    force: true
  });
});

gulp.task('lint', function() {
  return gulp.src([
    fileGlobs['src.ts'],
    fileGlobs['test.ts'],
  ])
    .pipe(tslint())
    .pipe(tslint.report('verbose', {
      emitError: false
    }));
});

gulp.task('tsc', ['lint'], function() {
  const tsProject = ts.createProject('tsconfig.json', {
    sortOutput: true,
    typescript,
  });

  const tsFiles = gulp.src([
    fileGlobs['src.ts'],
    fileGlobs['refs'],
  ])
    .pipe(sourcemaps.init())
    .pipe(ts(tsProject));

  const jsFiles = tsFiles.js
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(builtDir));

  const dtsFiles = tsFiles.dts
    .pipe(gulp.dest(builtDir));

  return mergeStream(jsFiles, dtsFiles);
});

gulp.task('build', [
  'clean',
  'lint',
  'tsc'
]);

gulp.task('test-build', ['build'], function() {
  const tsProject = ts.createProject('tests/tsconfig.json', {
    typescript,
  });

  return gulp.src([
    fileGlobs['lib.d.ts'],
    fileGlobs['test.ts'],
    fileGlobs['refs'],
  ])
    .pipe(ts(tsProject))
    .pipe(rename(function(path) {
      path.dirname = path.dirname.replace(/^tests\/?/, '');
    }))
    .pipe(gulp.dest(testBuildDir));
});

gulp.task('test', ['test-build'], function() {
  return gulp.src([
    fileGlobs['test.build.js'],
  ])
    .pipe(mocha({
      require: ['source-map-support/register']
    }));
});

gulp.task('watch', ['test-build'], function() {
  gulp.watch([
    'tsconfig.json',
    'tslint.json',
    'tests/tsconfig.json',
    fileGlobs['src.ts'],
    fileGlobs['test.ts'],
    fileGlobs['refs'],
  ], ['test']);
});

gulp.task('default', ['watch']);
