# Typescript+gulp+tslint base project:

I've recently started on a few new projects written in TypeScript.

This is a base project that sets up tooling for developing in TypeScript.

You should add a description and project name to the package.json-file otherwise
it's good to go.

## Folder structure:
Source code is placed in the src-folder.
Transpiled code (.js and d.ts-files) will be save to the lib folder.
Tests are placed in the tests-folder, import paths should use '../lib'.

## 'package.json':
'package.json' defines main as 'lib/index.js', you should create a src/index.ts file
that exports all default exports.

## 'tsconfig.json':
While you should add .ts-files to 'tsconfig.json' you don't have to, gulpfile.js
finds and adds the .ts-files under the build process. The same goes for
'tests/tsconfig.json'. Your editor will work better if you add the files.

When you add npm dependencies you should add typings aswell.
```bash
npm install --save package-name && typeing install --save package-name
```

## 'tslint.json':
Put your tslint config here, see [Documentation](http://palantir.github.io/tslint/usage/tslint-json/)

## Building and testing:

Building:
```bash
gulp build
```

Testing:
```bash
gulp test
```

Watching - write code and run tests on save:
```bash
gulp watch
```