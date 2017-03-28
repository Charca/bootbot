# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [1.0.10] - 2017-03-27
## Added
- Added `sendListTemplate` method.
- Added `imageAspectRatio` option to `sendGenericTemplate` method.

## Changed
- Small change to how we call the `listeningAnswer` in Conversations to fix nexted `convo.ask()` not firing. (See #11).

## [1.0.9] - 2017-03-16
### Added
- This Changelog.
- Link to Slack channel.
- Added .travis.yml to run our tests on https://travis-ci.org/Charca/bootbot
- Support for checkbox pluggin by [@rmattos](https://github.com/rmattos).

## [1.0.8] - 2017-02-23
### Added
- Added generic error message for when Messenger's API responds with an 'error' node.

[1.0.10]: https://github.com/Charca/bootbot/compare/v1.0.9...v1.0.10
[1.0.9]: https://github.com/Charca/bootbot/compare/v1.0.8...v1.0.9
[1.0.8]: https://github.com/Charca/bootbot/compare/v1.0.7...v1.0.8
