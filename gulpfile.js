'use strict';

const conventionalChangelog = require('gulp-conventional-changelog');
const del = require('del');
const exec = require('child_process').exec;
const fs = require('fs');
const git = require('gulp-git');
const gulp = require('gulp');
const jasmine = require('gulp-jasmine');
const minimist = require('minimist');
const ts = require('gulp-typescript');
const tslint = require('gulp-tslint');
const filter = require('gulp-filter');

const options = minimist(process.argv.slice(2), { strings: ['type'] });

const getBumpType = () => {
  const validTypes = ['major', 'minor', 'patch', 'prerelease'];
  if (validTypes.indexOf(options.type) === -1) {
    throw new Error(
      `You must specify a release type as one of (${validTypes.join(
        ', '
      )}), e.g. "--type minor"`
    );
  }
  return options.type;
};

const getPackageJsonVersion = () => {
  return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
};

const tsProjectBuildOutput = ts.createProject('tsconfig.json', {
  noEmit: false,
});

gulp.task('compile-build-output', () => {
  return compileBuildOutput();
});

gulp.task('bump-version', (callback) => {
  exec(
    `npm version ${getBumpType()} --no-git-tag-version`,
    (err, stdout, stderr) => {
      console.log(stdout);
      console.log(stderr);
      callback(err);
    }
  );
});

gulp.task('clean-dist', () => {
  return del(['dist/*']);
});

gulp.task('compile-dist', () => {
  const tsProjectDist = ts.createProject('tsconfig.json', { noEmit: false });
  const tsResult = gulp.src('lib/**/*.ts').pipe(tsProjectDist());
  return tsResult.js.pipe(gulp.dest('dist'));
});

gulp.task('changelog', (callback) => {
  exec(
    './node_modules/.bin/conventional-changelog -p angular -i CHANGELOG.md -s -r 0',
    (err, stdout, stderr) => {
      console.log(stdout);
      console.log(stderr);
      callback(err);
    }
  );
});

gulp.task('clean-build-output', () => {
  return del(['build-output/**/*.js']);
});

gulp.task(
  'clean-and-compile-build-output',
  gulp.series('clean-build-output', 'compile-build-output')
);

gulp.task('clean-and-compile-dist', gulp.series('clean-dist', 'compile-dist'));

gulp.task('commit-changes', () => {
  return gulp
    .src('.')
    .pipe(git.add())
    .pipe(git.commit(`chore: release ${getPackageJsonVersion()}`));
});

const compileBuildOutput = () => {
  const tsResult = tsProjectBuildOutput.src().pipe(tsProjectBuildOutput());
  return tsResult.js.pipe(gulp.dest('build-output'));
};

gulp.task('create-new-tag', (callback) => {
  const version = getPackageJsonVersion();
  git.tag(version, `Created Tag for version: ${version}`, callback);
});

gulp.task('lint-commits', (callback) => {
  exec(
    './node_modules/.bin/commitlint --from=99ff46d67 --preset angular',
    (err, stdout, stderr) => {
      console.log(stdout);
      console.log(stderr);
      callback(err);
    }
  );
});

gulp.task('lint-typescript', () => {
  return tsProjectBuildOutput
    .src()
    .pipe(tslint())
    .pipe(tslint.report());
});

gulp.task('push-changes', (callback) => {
  git.push('origin', 'master', { args: '--tags' }, callback);
});

const unitTests = 'build-output/test/unit/**/*.spec.js';
const e2eTests = 'build-output/test/e2e/**/*.spec.js';

gulp.task('e2e-test', () => {
  return gulp.src([e2eTests]).pipe(jasmine({ includeStackTrace: true }));
});

gulp.task('test', () => {
  return gulp
    .src([e2eTests, unitTests])
    .pipe(jasmine({ includeStackTrace: true }));
});

gulp.task('unit-test', () => {
  return gulp.src([unitTests]).pipe(jasmine({ includeStackTrace: true }));
});

gulp.task('compile-and-unit-test', () => {
  return compileBuildOutput()
    .pipe(filter([unitTests]))
    .pipe(jasmine({ includeStackTrace: true }));
});

gulp.task(
  'watch',
  gulp.series('clean-and-compile-build-output', () => {
    return gulp.watch(
      ['lib/**/*.ts', 'test/**/*.ts'],
      gulp.series('compile-and-unit-test')
    );
  })
);

gulp.task('watch-e2e', () => {
  return gulp.watch(
    ['build-output/lib/**/*', 'build-output/test/e2e/**/*'],
    gulp.series('e2e-test')
  );
});

gulp.task(
  'default',
  gulp.series(
    gulp.parallel('clean-and-compile-build-output', 'lint-commits'),
    gulp.parallel('lint-typescript', 'test')
  )
);

gulp.task(
  'release',
  gulp.series(
    'default',
    'clean-and-compile-dist',
    'bump-version',
    'changelog',
    'commit-changes',
    'create-new-tag',
    'push-changes'
  )
);
