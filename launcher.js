const { createWriteStream, existsSync, mkdirSync } = require('fs');
const { get } = require('https');
const { join, resolve } = require('path');
const { spawn } = require('child_process');
const { waitUntilUsed } = require('tcp-port-used');

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
  constructor(options = {}) {
    const port = options.port || 8080;
    const rootDir = options.rootDir || './mock';
    const stdio = options.stdio | 'inherit';
    const mavenBaseUrl = options.mavenBaseUrl || 'https://repo1.maven.org/maven2';
    const skipWiremockInstall = options.skipWiremockInstall || false;
    const args = options.args || [];
    const version = options.version || '2.26.3';

    const resolvedRootDir = resolve(rootDir);
    const compilerPath = resolve(join(__dirname, `wiremock-standalone-${version}.jar`));

    if (!existsSync(resolvedRootDir)) {
      mkdirSync(resolvedRootDir, { recursive: true });
    }

    this.port = port;
    this.spawnOptions = { stdio, detached: true };
    this.url = `${
      mavenBaseUrl
    }/com/github/tomakehurst/wiremock-standalone/${
      version
    }/wiremock-standalone-${
      version
    }.jar`;
    this.skipWiremockInstall = !!skipWiremockInstall;
    this.args = this.args.concat(['-jar', compilerPath]);
    this.args = this.args.concat(['-port', port]);
    this.args = this.args.concat(['-root-dir', resolvedRootDir]);
    this.args = this.args.concat(args);
  }

  async onPrepare(config, capabilities) {
    this.watchMode = !!config.watch;

    if (!existsSync(this.binPath) && !this.skipWiremockInstall) {
      process.stdout.write(`Downloading WireMock standalone from Maven Central...\n  ${this.url}\n`);
      const error = await installFile(this.url, this.binPath);
      if (error) {
        throw new Error(`Downloading WireMock jar from Maven Central failed: ${error}\n`);
      }
    }

    this.process = spawn('java', this.args, this.spawnOptions);

    this.process.on('error', (error) => {
      process.stderr.write(error);
    });

    this.process.on('exit', (code, signal) => {
      process.stdout.write(`Wiremock exited with code ${code} ${signal ? 'and signal ' + signal : ''}\n\n`);
    });

    if (this.watchMode) {
      process.on('SIGINT', this._stopProcess);
      process.on('exit', this._stopProcess);
      process.on('uncaughtException', this._stopProcess);
    }

    await waitUntilUsed(this.port, 100, 10000);
  }

  onComplete() {
    if (!this.watchMode) {
        this._stopProcess();
    }
  }

  _stopProcess() {
    if (this.process && !this.process.killed) {
        process.stdout.write('Shutting down wiremock\n');
        this.process.kill('SIGTERM');
    }
  }
}
