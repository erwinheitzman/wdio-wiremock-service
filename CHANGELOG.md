## 6.0.7

- Updated dependencies
- Removed obsolete dependencies
- Updated configurations
- Changed Husky setup
- Cleaned up project

## 6.0.6

- fixed killing of process

## 6.0.5

- Removed stdio option
- Added silent mode
- Updated dependencies

## 6.0.4

- Fixed a minor issue with some parameter types
- Updated dependencies

## 6.0.3

- Split logic
- Added more tests
- Updated dependencies

## 6.0.2

- Fixed Unrecognized option error when assigning arguments

## 6.0.0 - 6.0.1

- Updated the service to be optimised for WebdriverIO v6
- Fixed non-graceful shutdown when in watch mode

## 5.0.0 - 5.0.2

Had to re-release because of the missing `lib` directory on publish. Will investigate in order to get the release process setup automatically.

### Breaking changes

- Changed the default rootDir value from `mock` to `wiremock`.\
  Fix: simply rename the directory to `wiremock` or add the `rootDir` property to the options object and pass the value `mock` to keep the directory as it is.

### Notable changes

- Rewrote the service in TypeScript
- Added tests
- Added linting
- Added styling
- Added type declarations to the output
- Fixed arguments assignment issue
- Added WebdriverIO 5.X.X as a peer dependency
- Changed version to 5.0.0 as this service will add support for both WebdriverIO 5 and soon WebdriverIO 6

## 2.26.4

- Fixed options assignments

## 2.26.3

- Fixed port assignment issue
- Fixed issue where the arguments weren't passed correctly
- Updated default version to 2.26.3

## 2.26.2

- Added support for passing a different version

## 2.26.1

- Added examples using the HTTP API to the docs

## 2.26.0

- Updated to WireMock 2.26.0

## 2.25.1-8

- Added support for relative path for rootDir
- Added auto creation of the rootDir when it does not exist
- Fixed typo in README.md

## 2.25.1-7

- Added a default object to the options parameter for configuring the service
- Updated readme with examples, fixed typo

## 2.25.1-6

- Fixed logging on exit using wdio as standalone

## 2.25.1-5

- Fix port not being set correctly

## 2.25.1-4

- Fixed bug where a reference was incorrect

## 2.25.1-3

- Added args support
- Bug fixes
- Correctly added dependency `tcp-port-used`

## 2.25.1-2

- Added options support
- Updated readme
- Cleaned up code

## 2.25.1-1

- First working version of the service
