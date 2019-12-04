const { get } = require('https');
const { createWriteStream } = require('fs');
const { join } = require('path');
const { waitUntilUsed } = require('tcp-port-used');
const version = require('./package.json').version;

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
      const stream = createWriteStream(to);
      res.pipe(stream)
      res.on('end', () => resolve());
      res.on('error', () => reject(new Error('Could not write to ' + to)));
    });
  });
}

exports.default = class WiremockLauncher {
  constructor(options = {}) {
    this.options = options;
    this.options.port = options.port || 8080;
    this.options.rootDir = options.rootDir || './mock';
    this.options.stdio = options.stdio || 'inherit';
    this.options.mavenBaseUrl = options.mavenBaseUrl || 'https://repo1.maven.org/maven2';
  }

  async onPrepare(config, capabilities) {
    const wiremockVersion = version.split('-').shift();
    const url = this.options.mavenBaseUrl + '/com/github/tomakehurst/wiremock-standalone/'
      + `${wiremockVersion}/wiremock-standalone-${wiremockVersion}.jar`;

    console.log(`Downloading WireMock standalone from Maven Central...\n  ${url}`);

    const error = await installFile(url, join(__dirname, 'wiremock-standalone.jar'));
    if (error) {
      throw new Error(`Downloading WireMock jar from Maven Central failed: ${error}`);
    }
  
    const { spawn } = require('child_process');
    const compilerPath = require.resolve(join(__dirname, './wiremock-standalone.jar'));

    this.watchMode = !!config.watch;

    const portArgs = ['--port', this.options.port];
    const rootDirArgs = ['--root-dir', this.options.rootDir];

    this.process = spawn(
      'java',
      [ '-jar', compilerPath, ...rootDirArgs, ...portArgs ],
      { stdio: this.options.stdio, detached: true }
    );
    
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

    await waitUntilUsed(this.options.port, 100, 10000);
  }

  onComplete() {
    if (!this.watchMode) {
        this._stopProcess();
    }
  }

  _stopProcess = () => {
    if (this.process && !this.process.killed) {
        console.log('shutting down wiremock');
        this.process.kill('SIGTERM');
    }
  }
}
