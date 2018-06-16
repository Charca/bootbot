# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
### Fixed
- Fixed security vulnerability warning with `node-growl` library by upgrading `mocha` to v4.1.0.

## [1.0.15] - 2018-05-10
### Added
- Added support for `messaging_type`, `notification_type` and `tag` message properties.
- Added comments for JSDocs support.

## [1.0.14] - 2017-11-25
### Added
- Added `handleFacebookData` method that lets you use BootBot's API without running the built-in Express server.
- Added support for List Templates and Generic Templates via the `.say()` method.
- Added support for subsequent ordered calls to `.say()` by passing in an array of messages.

### Fixed
- Fixed validation of button templates on `_formatButton` method.

## [1.0.13] - 2017-11-10
### Added
- Support for custom webhook endpoint name.
- New link to slack channel invite.

## [1.0.12] - 2017-04-14
### Added
- Support for [Messenger Profile API](https://developers.facebook.com/docs/messenger-platform/messenger-profile).

## [1.0.11] - 2017-04-13
### Added
- Support for [referral event](https://developers.facebook.com/docs/messenger-platform/referral-params).

### Fixed
- Added `sendListTemplate()` method to Chat instance (it was only available on Bot instance).

## [1.0.10] - 2017-03-27
### Added
- Added `sendListTemplate` method.
- Added `imageAspectRatio` option to `sendGenericTemplate` method.

### Changed
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

[Unreleased]: https://github.com/Charca/bootbot/compare/v1.0.15...HEAD
[1.0.15]: https://github.com/Charca/bootbot/compare/v1.0.14...v1.0.15
[1.0.14]: https://github.com/Charca/bootbot/compare/v1.0.13...v1.0.14
[1.0.13]: https://github.com/Charca/bootbot/compare/v1.0.12...v1.0.13
[1.0.12]: https://github.com/Charca/bootbot/compare/v1.0.11...v1.0.12
[1.0.11]: https://github.com/Charca/bootbot/compare/v1.0.10...v1.0.11
[1.0.10]: https://github.com/Charca/bootbot/compare/v1.0.9...v1.0.10
[1.0.9]: https://github.com/Charca/bootbot/compare/v1.0.8...v1.0.9
[1.0.8]: https://github.com/Charca/bootbot/compare/v1.0.7...v1.0.8
