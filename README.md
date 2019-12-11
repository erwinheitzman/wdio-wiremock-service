
# WebdriverIO WireMock Service

[![npm version](https://badge.fury.io/js/wdio-wiremock-service.svg)](https://www.npmjs.com/package/wdio-wiremock-service)
[![downloads](https://img.shields.io/npm/dm/wdio-wiremock-service.svg)](https://www.npmjs.com/package/wdio-wiremock-service)

[![Join the chat at https://gitter.im/erwinheitzman/wdio-wiremock-service](https://badges.gitter.im/erwinheitzman/wdio-wiremock-service.svg)](https://gitter.im/erwinheitzman/wdio-wiremock-service?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This service helps you to run [WireMock](http://wiremock.org/) seamlessly when running tests with [WebdriverIO](https://webdriver.io). It uses the well known [Maven](https://mvnrepository.com/repos/central) repository to download the WireMock jar for you which is then automatically installed, started and stopped. Stay up to date by joining the community over at [Gitter](https://gitter.im/erwinheitzman/wdio-wiremock-service) for help and support.

## Installation

```bash
npm install wdio-wiremock-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)

## Configuration

In order to use the service with the wdio testrunner you need to add it to your service array:

```js
// wdio.conf.js
export.config = {
  // ...
  services: ['wiremock'],
  // ...
};
```

When using webdriverio standalone you need to add the service and trigger the `onPrepare` and `onComplete` hooks manually. An example can be found [here](####webdriverio-standalone) (the example makes use of [Jest](https://jestjs.io/en/)):

## Usage

In the root directory (default `./mock`) you find two subdirectories, `__files` and `mappings` which are used for your fixtures and mocks.

### Fixtures

WireMock allows you to use fixture files alongside your mocks, place these in the `__files` directory.

Example of a fixture:

```json
Hello world!
```

### Mocks

In order for WireMock to find your mocks, place them in the `mappings` directory.

Example of a mock:

```json
{
  "request": {
      "method": "GET",
      "url": "/api/mytest"
  },
  "response": {
      "status": 200,
      "body": "Hello world!"
  }
}
```

Example of a mock with a fixture:

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

### Writing tests

Writing your first test is really straight forward:

#### Using the WDIO testrunner in synch mode

<sub><sup>`./test/specs/mytest.js`</sup></sub>
```js
const fetch = require('node-fetch');
const assert = require('assert');

it('should assert the mock data', () => {
  browser.call(async () => {
    await fetch('http://localhost:8080/api/mytest')
      .then((res) => res.text())
      .then((body) => {
          // assert that the request body returns the expected value
          assert.equal(body, 'More content');
      });
  });
});
```

#### Usiong the WDIO testrunner in async mode

```js
const fetch = require('node-fetch');
const assert = require('assert');

it('should assert the mock data', async () => {
  await browser.call(async () => {
    await fetch('http://localhost:8080/api/mytest')
      .then((res) => res.text())
      .then((body) => {
          // assert that the request body returns the expected value
          assert.equal(body, 'More content');
      });
  });
});
```

#### Using WebdriverIO Standalone

<sub><sup>`./test/specs/mytest.js`</sup></sub>
```js
const nodeFetch = require('node-fetch')
const { remote } = require('webdriverio')
const { launcher } = require('wdio-wiremock-service') // import the service

const WDIO_OPTIONS = {
  port: 9515, // chromedriver port
  path: '/', // remove `path` if you decided using something different from driver binaries.
  capabilities: {
      browserName: 'chrome'
  },
}

let wiremockLauncher = new launcher() // create instance of the service
let client;

beforeAll(async () => {
  await wiremockLauncher.onPrepare(WDIO_OPTIONS) // run the onPrepare hook
  client = await remote(WDIO_OPTIONS)
})

afterAll(async () => {
  await client.deleteSession()
  await wiremockLauncher.onComplete() // run the onComplete hook
});

test('should showoff a mocked api response', async () => {
  await client.call(async () => {
    await nodeFetch('http://localhost:8080/api/mytest')
      .then((res) => res.text())
      .then((body) => expect(body).toEqual('Hello world!'));
  });
});
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

### args
List where you can pass all the supported arguments for configuring WireMock

Note: you cannot pass the options (`port`, `rootDir`, `stdio`, `mavenBaseUrl`) here as they will be ignored.

Type: `Array`

Example:
```js
// wdio.conf.js
export.config = {
  // ...
  services: [
    ['wiremock', {
      args: [ '--verbose', '--match-headers' ]
    }]
  ],
  // ...
};
```

For more information on WebdriverIO see the [homepage](https://webdriver.io).