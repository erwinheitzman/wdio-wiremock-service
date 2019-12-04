const { get } = require('https');
const { createWriteStream } = require('fs');
const { join } = require('path');
const version = require('./package.json').version;

function getDownloadStream(downloadUrl, cb) {
  var r = get(downloadUrl).on('response', (res) => {

    if (res.statusCode !== 200) {
      return cb(new Error('Could not download ' + downloadUrl));
    }

    cb(null, res);
  })
  .once('error', (error) => {
    cb(new Error('Could not download ' + downloadUrl + ': ' + error));
  });

  r.end();
}

function installFile(from, to, cb) {
  getDownloadStream(from, (err, stream) => {
    if (err) {
      return cb(err);
    }

    stream
      .pipe(createWriteStream(to))
      .once('error', cb.bind(null, new Error('Could not write to ' + to)))
      .once('finish', cb);
  });
}

exports.default = class WiremockLauncher {
  constructor(options = {}) {
    this.options = options;
    this.options.rootDir = ['--root-dir', options.rootDir || './mock'];
    this.options.stdio = options.stdio || 'inherit';
    this.options.mavenBaseUrl = options.mavenBaseUrl || 'https://repo1.maven.org/maven2';
  }

  onPrepare(config, capabilities) {
    const wiremockVersion = version.split('-').shift();
    const url = this.options.mavenBaseUrl + '/com/github/tomakehurst/wiremock-standalone/'
      + `${wiremockVersion}/wiremock-standalone-${wiremockVersion}.jar`;

    console.log(`Downloading WireMock standalone from Maven Central...\n  ${url}`);

    installFile(url, join(__dirname, 'wiremock-standalone.jar'), (error) => {
      if (error) {
        throw new Error(`Downloading WireMock jar from Maven Central failed: ${error}`);
      }
    
      const { spawn } = require('child_process');
      const compilerPath = require.resolve(join(__dirname, './wiremock-standalone.jar'));
  
      this.watchMode = !!config.watch;
  
      this.process = spawn(
        'java',
        [ '-jar', compilerPath, ...this.options.rootDir ],
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
    });
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
