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

IMPORTANT in version 5 of WebdriverIO you will need to set the port manually!

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

### HTTP API

You can also create a stub mapping by posting to WireMock’s HTTP API, this is useful when you want to set different states.

#### Basic stubbing

The following code will configure a response with a status of 200 to be returned when the relative URL exactly matches /example/data (including query parameters). The body of the response will be `{ "dummy": [{ "data": "example" }]}` and a Content-Type header will be sent with a value of application/json.

```js
it(`a mocked api response created using WireMock's HTTP API`, async () => {
	const expectedRes = {
		dummy: [
			{
				data: 'example',
			},
		],
	};

	const body = JSON.stringify({
		request: {
			method: 'GET',
			url: '/example/data',
		},
		response: {
			status: 200,
			jsonBody: expectedRes,
		},
	});

	await browser.call(async () => {
		await nodeFetch('http://localhost:8080/__admin/mappings/new', { method: 'POST', body });

		await nodeFetch('http://localhost:8080/example/data')
			.then((res: any) => res.json())
			.then((body: any) => expect(body).toEqual(expectedRes));
	});
});
```

To create the stub described above via the JSON API, the following document can either be posted to `http://<host>:<port>/__admin/mappings` or placed in a file with a .json extension under the mappings directory as a fixture.

#### Saving stubs

Stub mappings which have been created can be persisted to the mappings directory via a call to WireMock by posting a request with an empty body to `http://<host>:<port>/__admin/mappings/save`.

#### File serving

When running the standalone JAR, files placed under the `__files` directory will be served up as if from under the docroot (rootDir), except if stub mapping matching the URL exists. For example if a file exists `__files/things/myfile.html` and no stub mapping will match `/things/myfile.html` then hitting `http://<host>:<port>/things/myfile.html` will serve the file.

#### Removing stubs

Stub mappings can be deleted via the HTTP API by issuing a `DELETE` to `http://<host>:<port>/__admin/mappings/{id}` where id is the UUID of the stub mapping, found in its id field.

#### Reset

The WireMock server can be reset at any time, removing all stub mappings and deleting the request log by sending a `POST` request with an empty body to `http://<host>:<port>/__admin/reset`.

#### Getting all currently registered stub mappings

All stub mappings can be fetched by sending a `GET` to `http://<host>:<port>/__admin/mappings`.
Optionally limit and offset parameters can be specified to constrain the set returned e.g. `GET` `http://localhost:8080/__admin/mappings?limit=10&offset=50`.

#### Getting a single stub mapping by ID

A single stub mapping can be retrieved by ID by sending a `GET` to `http://<host>:<port>/__admin/mappings/{id}`.

#### More information

For more information about stubbing check [WireMock's official documentation](http://wiremock.org/docs/stubbing/).

### Writing tests

Writing your first test is really straight forward:

#### Using the WDIO testrunner in synch mode

```js title="./test/specs/mytest.js"
const fetch = require('node-fetch');
const assert = require('assert');

it(`should assert the mock data`, () => {
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

#### Using the WDIO testrunner in async mode

```js
const fetch = require('node-fetch');
const assert = require('assert');

it(`should assert the mock data`, async () => {
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

```js title="./test/specs/mytest.js"
const nodeFetch = require('node-fetch');
const { remote } = require('webdriverio');
const { launcher } = require('wdio-wiremock-service'); // import the service

const WDIO_OPTIONS = {
	port: 9515, // chromedriver port
	path: '/', // remove `path` if you decided using something different from driver binaries.
	capabilities: {
		browserName: 'chrome',
	},
};

let wiremockLauncher = new launcher(); // create instance of the service
let client;

beforeAll(async () => {
	await wiremockLauncher.onPrepare(WDIO_OPTIONS); // run the onPrepare hook
	client = await remote(WDIO_OPTIONS);
});

afterAll(async () => {
	await client.deleteSession();
	await wiremockLauncher.onComplete(); // run the onComplete hook
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

### version

Version of WireMock to be downloaded and used.

Type: `String`

Default: `2.26.3`

Example:

```js
// wdio.conf.js
export.config = {
  // ...
  services: [
    ['wiremock', { version: '2.25.1' }]
  ],
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
export.config = {
  // ...
  services: [
    ['wiremock', { silent: true }]
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
