# WebdriverIO WireMock Service

[![npm version](https://badge.fury.io/js/wdio-wiremock-service.svg)](https://www.npmjs.com/package/wdio-wiremock-service)
[![downloads](https://img.shields.io/npm/dm/wdio-wiremock-service.svg)](https://www.npmjs.com/package/wdio-wiremock-service)

[![Join the chat at https://gitter.im/erwinheitzman/wdio-wiremock-service](https://badges.gitter.im/erwinheitzman/wdio-wiremock-service.svg)](https://gitter.im/erwinheitzman/wdio-wiremock-service?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This service helps you to run [WireMock](http://wiremock.org/) seamlessly when running tests with [WebdriverIO](https://webdriver.io). It uses the well known [Maven](https://mvnrepository.com/repos/central) repository to download the WireMock jar for you which is then automatically installed, started and stopped. Stay up to date by joining the community over at [Gitter](https://gitter.im/erwinheitzman/wdio-wiremock-service) for help and support.

## Installation

```bash
npm i -D wdio-wiremock-service
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)

## Usage

In the root directory (default `./mock`) you find two subdirectories, `__files` and `mappings` which are used for your fixtures and mocks.

For more information, checkout [WireMock's official documentation](https://wiremock.org/docs/standalone/).

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

## Options

The following options can be added to the service.

### port

Port where WireMock should run on.

Type: `Number`

Default: `8080`

Example:

```js
// wdio.conf.js
export const config = {
	// ...
	services: [['wiremock', { port: 8181 }]],
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
export const config = {
	// ...
	services: [['wiremock', { rootDir: './mock' }]],
	// ...
};
```

### version

Version of WireMock to be downloaded and used.

Type: `String`

Default: `3.3.1`

Example:

```js
// wdio.conf.js
export const config = {
	// ...
	services: [['wiremock', { version: '2.25.1' }]],
	// ...
};
```

### skipWiremockInstall

Tell the service to skip downloading WireMock.

Type: `Boolean`

Default: false

Example:

```js
// wdio.conf.js
export const config = {
	// ...
	services: [['wiremock', { skipWiremockInstall: true }]],
	// ...
};
```

### binPath

Custom path to a local Wiremock binary (often used in combination with skipWiremockInstall).

Type: `String`

Default: './wiremock-standalone-3.0.0.jar' (relative from service)

Example:

```js
// wdio.conf.js
export const config = {
	// ...
	services: [['wiremock', { binPath: './my-custom/example-path/wiremock-standalone-3.0.0.jar' }]],
	// ...
};
```

### silent

Silent mode for logging WireMock's output (including additional logging from the service itself).

Type: `Boolean`

Default: `false`

Example:

```js
// wdio.conf.js
export const config = {
	// ...
	services: [['wiremock', { silent: true }]],
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
export const config = {
	// ...
	services: [['wiremock', { mavenBaseUrl: 'https://repo1.maven.org/maven2' }]],
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
export const config = {
	// ...
	services: [
		[
			'wiremock',
			{
				args: ['--verbose', '--match-headers'],
			},
		],
	],
	// ...
};
```

### Writing tests

Writing your first test is really straight forward:

#### Using the WDIO testrunner

```js
import fetch from 'node-fetch'; // you can use any HTTP client you like
import { equal } from 'node:assert'; // you can use any assertion library you like

describe('example', () => {
	it(`should assert the mock data`, async () => {
		const body = await fetch('http://localhost:8080/api/mytest');
		equal(body.text(), 'Hello world!');
	});
});
```

#### Using WebdriverIO Standalone

```js
import fetch from 'node-fetch'; // you can use any HTTP client you like
import { equal } from 'node:assert'; // you can use any assertion library you like
import { remote } from 'webdriverio';
import { launcher } from 'wdio-wiremock-service';

const WDIO_OPTIONS = {
	capabilities: {
		browserName: 'chrome',
	},
};

describe('example', () => {
	let wiremockLauncher;
	let client;

	beforeAll(async () => {
		wiremockLauncher = new launcher(); // create instance of the service
		await wiremockLauncher.onPrepare(WDIO_OPTIONS); // run the onPrepare hook
		client = await remote(WDIO_OPTIONS);
	});

	afterAll(async () => {
		await client.deleteSession();
		await wiremockLauncher.onComplete(); // run the onComplete hook
	});

	test('should showoff a mocked api response', async () => {
		const body = await fetch('http://localhost:8080/api/mytest');
		equal(body.text(), 'Hello world!');
	});
});
```

For more information on WebdriverIO see the [homepage](https://webdriver.io).
