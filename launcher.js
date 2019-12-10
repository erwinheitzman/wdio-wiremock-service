const { createWriteStream, existsSync } = require('fs');
const { get } = require('https');
const { join, resolve } = require('path');
const { spawn } = require('child_process');
const { waitUntilUsed } = require('tcp-port-used');
const { version } = require('./package.json');

const wmVersion = version.split('-').shift();
const binPath = join(__dirname, `wiremock-standalone-${wmVersion}.jar`);
const compilerPath = resolve(binPath);

function httpRequest(url) {
  return new Promise((resolve, reject) => {
      const req = get(url, (res) => {
          if (res.statusCode !== 200) {
              return reject(new Error('statusCode=' + res.statusCode));
          }

          return resolve(res);
      });

      req.on('error', (err) => {
          reject(err);
      });

      req.end();
  });
}

async function installFile(from, to) {
  return httpRequest(from).then(res => {
    return new Promise((resolve, reject) => {
      res.pipe(createWriteStream(to))
      res.on('end', () => resolve());
      res.on('error', () => reject(new Error('Could not write to ' + to)));
    });
  });
}

exports.default = class WiremockLauncher {
  constructor({
    port = 8080,
    rootDir = './mock',
    stdio = 'inherit',
    mavenBaseUrl = 'https://repo1.maven.org/maven2',
    skipWiremockInstall = false,
    args = []
  }) {
    this.args = [];
    this.args = this.args.concat(['-jar', compilerPath]);
    this.args = this.args.concat(['-port', port]);
    this.args = this.args.concat(['-root-dir', rootDir]);
    this.args = this.args.concat(args);

    this.spawnOptions = { stdio, detached: true };
    this.url = `${
      mavenBaseUrl
    }/com/github/tomakehurst/wiremock-standalone/${
      wmVersion
    }/wiremock-standalone-${
      wmVersion
    }.jar`;
    this.skipWiremockInstall = !!skipWiremockInstall;
  }

  async onPrepare(config, capabilities) {
    this.watchMode = !!config.watch;

    if (!existsSync(binPath) && !this.skipWiremockInstall) {
      console.log(`Downloading WireMock standalone from Maven Central...\n  ${this.url}`);
      const error = await installFile(this.url, binPath);
      if (error) {
        throw new Error(`Downloading WireMock jar from Maven Central failed: ${error}`);
      }
    }

    this.process = spawn('java', this.args, this.spawnOptions);

    this.process.on('error', (error) => {
      console.error(error);
    });

    this.process.on('exit', (code, signal) => {
      console.log(`wiremock exited with code ${code} and signal ${signal}`);
    });

    if (this.watchMode) {
      process.on('SIGINT', this._stopProcess);
      process.on('exit', this._stopProcess);
      process.on('uncaughtException', this._stopProcess);
    }

    await waitUntilUsed(port, 100, 10000);
  }

  onComplete() {
    if (!this.watchMode) {
        this._stopProcess();
    }
  }

  _stopProcess() {
    if (this.process && !this.process.killed) {
        console.log('shutting down wiremock');
        this.process.kill('SIGTERM');
    }
  }
}
