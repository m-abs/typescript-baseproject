'use strict';

// Imports
const pkg = require('./package.json');
const gulp = require('gulp');
const mocha = require('gulp-mocha');
const sourcemaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');
const typescript = require('typescript');
const tslint = require('gulp-tslint');
const del = require('del');
const mergeStream = require('merge-stream');
const tsConfigGlob = require('tsconfig-glob');

// Const values
const buildDir = 'lib';
const testBuildDir = '.tmp';

const srcDir = 'src';
const testSrcDir = 'tests';

// Helper functions:

/**
 * Lint source ts-files
 * @param tsconfigPath    path to tsconfig.json-file
 */
const lint = function(tsconfigPath) {
  const tsProject = ts.createProject(tsconfigPath, {
    typescript,
  });

  return tsProject.src()
    .pipe(tslint())
    .pipe(tslint.report('verbose', {
      emitError: false
    }));
};

/**
 * @param configPath      path containing the tsconfig.json-file
 * @param cb              The task's callback function, this is required to avoid infinite loops
 */
const filesGlob = function(configPath, cb) {
  return tsConfigGlob({
    configPath,
    cwd: process.cwd(),
    indent: 2
  }, function (err) {
    if (err) {
      console.log('[tsConfig - err] ' + JSON.stringify(err));
      throw err;
    }

    cb();
  });
};

// Tasks:

// Delete transpiled files from the built-dir and the test-built-dir
gulp.task('clean', function() {
  del.sync([
    buildDir,
    testBuildDir,
  ], {
    force: true
  });
});

// Lint project files
gulp.task('lint', ['tsconfig:filesGlob'], function() {
  return lint('tsconfig.json');
});

// Lint test files
// Depends:
//  - tsc => Because tests imports the transpiled files from ./lib and not the source files
//  - tsconfig:tests:filesGlob
gulp.task('lint:tests', ['tsc', 'tsconfig:tests:filesGlob'], function() {
  return lint('tests/tsconfig.json');
});

// Transpil project src-files into JavaScript
gulp.task('tsc', ['lint'], function() {
  // Load projects config
  const tsProject = ts.createProject('tsconfig.json', {
    sortOutput: true, // This is required for the sourcemap to work
    typescript,
  });

  // Setup building the ts-files
  const tsFiles = tsProject.src()
    .pipe(sourcemaps.init())
    .pipe(ts(tsProject));

  // In gulp-typescript, .js-files and .d.ts-files end up in separate output streams

  // Write the JavaScript-files to our buildDir
  const jsFiles = tsFiles.js
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(buildDir));

  // Write the typedefition-files (.d.ts-files) to our buildDir
  const dtsFiles = tsFiles.dts
    .pipe(gulp.dest(buildDir));

  // Merge the two streams for completing this task
  return mergeStream(jsFiles, dtsFiles);
});

// Wrapper task for building the project
gulp.task('build', [
  'clean',
  'lint',
  'tsc'
]);

// Transpil project tests into JavaScript-files for mocha tests below
gulp.task('tsc:tests', ['build', 'lint:tests'], function() {
  const tsProject = ts.createProject('tests/tsconfig.json', {
    typescript,
  })

  return tsProject.src()
    .pipe(ts(tsProject))
    .pipe(gulp.dest(testBuildDir));
});

// Run the mocha-tests
// Depends:
//  - tsc:tests => For transpiling the test source-code
gulp.task('test', ['tsc:tests'], function() {
  // Mocha works on the JavaScript-files not the .ts-files
  return gulp.src([
    `${testBuildDir}/**/*.js`,
  ])
    .pipe(mocha({
      require: ['source-map-support/register']
    }));
});

// Watch for changes
gulp.task('watch', function() {
  const watchFilesGlob = [
    'tsconfig.json',
    'tests/tsconfig.json',
    'tslint.json',
    'typings.json',
  ];

  // Load the filesGlob from the two tsconfig.json-files, so we can watch them.
  for (const glob of require('./tsconfig.json').filesGlob) {
    watchFilesGlob.push(glob);
  }

  for (const glob of require('./tests/tsconfig.json').filesGlob) {
    watchFilesGlob.push(`tests/${glob}`);
  }

  return gulp.watch(watchFilesGlob, {
    readDelay: 250
  }, ['test']);
});

// Make watch-task our default task
gulp.task('default', ['watch']);

// Update tsconfig.json's files-array from the filesGlob
gulp.task('tsconfig:filesGlob', function(cb) {
  return filesGlob('.', cb);
});

// Update tests/tsconfig.json's files-array from the filesGlob
gulp.task('tsconfig:tests:filesGlob', function(cb) {
  return filesGlob('./tests', cb);
});

// Helper task for updating tsconfig.json and tests/tsconfig.json
gulp.task('filesGlob', [
  'tsconfig:filesGlob',
  'tsconfig:tests:filesGlob'
]);
