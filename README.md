# wdio-wiremock-service
A WebdriverIO service to start &amp; stop WireMock

WebdriverIO WireMock Service
=======================================

 This service helps you to run WireMock seamlessly when running tests with [WebdriverIO](https://webdriver.io). It uses the well know [maven](https://mvnrepository.com/repos/central) repository to download the WireMock jar for you which is then automatically installed and started.

## Installation

Before starting make sure you have JDK installed.

The easiest way is to keep `wdio-wiremock-service` as a devDependency in your `package.json`.

```json
{
  "devDependencies": {
    "wdio-wiremock-service": "^5.0.0"
  }
}
```

You can simple do it by:

```bash
npm install wdio-wiremock-service --save-dev
```

Instructions on how to install `WebdriverIO` can be found [here.](https://webdriver.io/docs/gettingstarted.html)

## Configuration

In order to use the service you need to add `wdio-wiremock-service` to your service array:

```js
// wdio.conf.js
export.config = {
  // ...
  services: ['wdio-wiremock-service'],
  // ...
};
```

## Options

The following options can be added to the service.

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
    ['wdio-wiremock-service', { rootDir: './mock' }]
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
    ['wdio-wiremock-service', { stdio: 'inherit' }]
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
    ['wdio-wiremock-service', { mavenBaseUrl: 'https://repo1.maven.org/maven2' }]
  ],
  // ...
};
```

For more information on WebdriverIO see the [homepage](https://webdriver.io).