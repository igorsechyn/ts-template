# TS template for CLIs and Services
> A scaffolding template to create CLIs and services in typescript

## Requirements
- nodejs 10.x or higher
- ts 3.x or higher

## What is included

- typescript type checking and transpilation
- test infrastructure for unit and e2e tests using jest (feel free to replace it with other frameworks)
- code linting
- [convnentional commit messages linting](https://conventional-changelog.github.io/commitlint/#/)
- [automated CHANGELOG generation based on commit messages](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-cli)
- automated release process

## Usage

- clone this repository
- remove `.git` folder
- replace `version`, `name` and `description` attributes in `package.json`
- write your own `README`
- start writing your code
- update git revision to start linting your commits from in `gulpfile.js` (see task lint-commits)

## Changelog
See [CHANGELOG.md](CHANGELOG.md)

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md)