
# WebdriverIO WireMock Service

[![npm version](https://badge.fury.io/js/wdio-wiremock-service.svg)](https://badge.fury.io/js/wdio-wiremock-service)
[![Downloads](https://img.shields.io/npm/dm/wdio-wiremock-service.svg)](https://www.npmjs.com/package/typescript)

[![Join the chat at https://gitter.im/erwinheitzman/wdio-wiremock-service](https://badges.gitter.im/erwinheitzman/wdio-wiremock-service.svg)](https://gitter.im/erwinheitzman/wdio-wiremock-service?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This service helps you to run WireMock seamlessly when running tests with [WebdriverIO](https://webdriver.io). It uses the well know [Maven](https://mvnrepository.com/repos/central) repository to download the WireMock jar for you which is then automatically installed, started and stopped. Stay up to date by joining the community over at [Gitter](https://gitter.im/erwinheitzman/wdio-wiremock-service) to join others and for support.

## Installation

```bash
npm install wdio-wiremock-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)

## Configuration

In order to use the service you need to add it to your service array:

```js
// wdio.conf.js
export.config = {
  // ...
  services: ['wiremock'],
  // ...
};
```

## Usage

In the root directory (default `./mock`) you find two subdirectories, `__files` and `mappings`.

### Fixtures

WireMock allows you to use fixture files alongside your mocks. These files can be placed in the `__files` directory. These files can then be used by your mocks.

An example of a fixture file:

```json
Hello world
```

### Mocks

Your mock files are to be placed in the `mappings` directory.

An example of a mock file:

```json
{
  "request": {
      "method": "GET",
      "url": "/api/mytest"
  },
  "response": {
      "status": 200,
      "bodyFileName": "hello-world.json"
  }
}
```

An example without the use of fixtures:

```json
{
  "request": {
      "method": "GET",
      "url": "/api/mytest"
  },
  "response": {
      "status": 200,
      "body": "Hello world"
  }
}
```

## Options

The following options can be added to the service.

### port
Port where WireMock should run on.

Type: `Number`

Default: `8080`

Example:
```js
// wdio.conf.js
export.config = {
  // ...
  services: [
    ['wiremock', { port: 8181 }]
  ],
  // ...
};
```

### rootDir
Path where WireMock will look for files.

Type: `String`

Default: `./mock`

Example:
```js
// wdio.conf.js
export.config = {
  // ...
  services: [
    ['wiremock', { rootDir: './mock' }]
  ],
  // ...
};
```

### stdio
Level of logging (for simplicity this can be set to: `pipe`, `ignore`, `inherit`).
For more information see [stdio](https://nodejs.org/api/child_process.html#child_process_options_stdio).

Type: `Array | String`

Default: `inherit`

Example:
```js
// wdio.conf.js
export.config = {
  // ...
  services: [
    ['wiremock', { stdio: 'inherit' }]
  ],
  // ...
};
```

### mavenBaseUrl
Base download url for Maven.

Type: `String`

Default: `https://repo1.maven.org/maven2`

Example:
```js
// wdio.conf.js
export.config = {
  // ...
  services: [
    ['wiremock', { mavenBaseUrl: 'https://repo1.maven.org/maven2' }]
  ],
  // ...
};
```

For more information on WebdriverIO see the [homepage](https://webdriver.io).