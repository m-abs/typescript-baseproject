'use strict';

// Imports
const pkg = require('./package.json');
const gulp = require('gulp');
const sass = require('gulp-sass');
const inlineNg2Template = require('gulp-inline-ng2-template');
const mocha = require('gulp-mocha');
const sourcemaps = require('gulp-sourcemaps');
const ts = require('gulp-typescript');
const typescript = require('typescript');
const tslint = require('gulp-tslint');
const rename = require('gulp-rename');
const del = require('del');
const mkdirp = require('mkdirp');
const mergeStream = require('merge-stream');
const cp = require('child_process');

// Const values
const buildDir = 'lib';
const testBuildDir = '.tmp';

const srcDir = 'src';
const testSrcDir = 'tests';

// Helper functions:

const genFileGlobFromTsconfig = function(tsconfigPath) {
  const tsConfig = require(`./${tsconfigPath}`);

  const output = [
    ...tsConfig.include,
  ];

  for (const exc of (tsConfig.exclude || [])) {
    output.push(`!${exc}`);
  }

  return output;
}

/**
 * Lint source ts-files
 * @param tsconfigPath    path to tsconfig.json-file
 */
const lint = function(tsconfigPath) {
  const fileGlobs = [
    ...genFileGlobFromTsconfig(tsconfigPath),
    "!**/*.ngfactory.ts",
    "!**/*.shim.ts",
  ];

  return gulp.src(fileGlobs)
    .pipe(tslint())
    .pipe(tslint.report('verbose', {
      emitError: false
    }));
};

// Tasks:

// Delete transpiled files from the built-dir and the test-built-dir
gulp.task('clean', function(cb) {
  del([
    buildDir,
    testBuildDir,
    "src/**/*.ngfactory.ts",
    "src/**/*.shim.ts",
    "src/**/*.js",
    "src/**/*.css",
    "src/**/*.js.map",
    "src/**/*.metadata.json",
  ], {
    force: true
  })
  .then(function() {
    mkdirp(buildDir, function() {
      mkdirp(testBuildDir, function() {
        cb();
      });
    });
  });
});

// Lint project files
gulp.task('lint', function() {
  return lint('tsconfig.json');
});

// Lint test files
// Depends:
//  - tsc => Because tests imports the transpiled files from ./lib and not the source files
gulp.task('lint:tests', ['tsc'], function() {
  return lint('tests/tsconfig.json');
});

gulp.task('sass:build', ['clean'], function() {
  return gulp.src([`${srcDir}/**/*.scss`])
    .pipe(sass({
      includePaths: `${__dirname}/node_modules`,
    }))
    .pipe(gulp.dest(srcDir));
});

gulp.task('sass', ['sass:build'], function() {
  return gulp.src([`${srcDir}/**/*.css`])
    .pipe(gulp.dest(buildDir));
});

// Transpil project src-files into JavaScript
gulp.task('tsc', ['clean', 'lint', 'ngc', 'sass'], function() {
  // Load projects config
  const tsProject = ts.createProject('tsconfig.json', {
    sortOutput: true, // This is required for the sourcemap to work
    typescript,
  });

  const fileGlobs = [
    ...genFileGlobFromTsconfig('tsconfig.json'),
  ];

  // Setup building the ts-files
  const tsFiles = gulp.src(fileGlobs)
    .pipe(sourcemaps.init())
    .pipe(inlineNg2Template({
      base: srcDir,
    }))
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

// Transpil project src-files into JavaScript
gulp.task('ngc', ['clean'], function(cb) {
  cp.exec('./node_modules/.bin/ngc -p tsconfig.json', function(err, output) {
    if (err) {
      console.error(output);
      throw new Error('ngc failed');
    }

    cb();
  });
});

// Wrapper task for building the project
gulp.task('build', [
  'clean',
  'tsc'
]);

// Transpil project tests into JavaScript-files for mocha tests below
gulp.task('tsc:tests', ['lint:tests', 'build'], function() {
  throw new Error('running tests is not implemented');
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
gulp.task('watch', ['tsc'], function() {
  const watchFilesGlob = [
    'tsconfig.json',
    'tests/tsconfig.json',
    'tslint.json',
    ...genFileGlobFromTsconfig('tsconfig.json'),
    ...genFileGlobFromTsconfig('tests/tsconfig.json'),
  ];

  return gulp.watch(watchFilesGlob, {
    readDelay: 250
  }, ['test']);
});

// Make watch-task our default task
gulp.task('default', ['watch']);
