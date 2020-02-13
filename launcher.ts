import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { get } from 'https';
import { join, resolve } from 'path';
import { spawn, ChildProcess, StdioOptions } from 'child_process';
import { waitUntilUsed } from 'tcp-port-used';
import { IncomingMessage } from 'http';

export function httpRequest(url: string): Promise<IncomingMessage> {
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

export async function installFile(from: string, to: string): Promise<IncomingMessage> {
  return httpRequest(from).then((res) => {
    return new Promise((resolve, reject) => {
      res.pipe(createWriteStream(to))
      res.on('end', () => resolve());
      res.on('error', () => reject(new Error('Could not write to ' + to)));
    });
  });
}

export class WiremockLauncher {
  private args: Array<string>;
  private port: number;
  private spawnOptions: { stdio: StdioOptions, detached: boolean };
  private url: string;
  private skipWiremockInstall: boolean;
  private watchMode: boolean;
  private process: ChildProcess | null;
  private binPath: string;

  constructor({
    port = 8080,
    rootDir = './mock',
    stdio = 'inherit' as StdioOptions,
    mavenBaseUrl = 'https://repo1.maven.org/maven2',
    skipWiremockInstall = false,
    args = [],
    version = '2.26.0',
  } = {}) {
    this.binPath = join(__dirname, `wiremock-standalone-${version}.jar`);
    
    const resolvedRootDir = resolve(rootDir);
    const resolvedBinPath = resolve(this.binPath);

    if (!existsSync(resolvedRootDir)) {
      mkdirSync(resolvedRootDir, { recursive: true });
    }

    this.args = [];
    this.args = this.args.concat(['-jar', resolvedBinPath]);
    this.args = this.args.concat(['-port', port.toString()]);
    this.args = this.args.concat(['-root-dir', resolvedRootDir]);
    this.args = this.args.concat(args);

    this.watchMode = false;
    this.process = null;
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
  }

  public async onPrepare(config: any) {
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
      process.stderr.write(error.message);
    });

    this.process.on('exit', (code, signal) => {
      process.stdout.write(`Wiremock exited with code ${code} ${signal ? 'and signal ' + signal : ''}\n\n`);
    });

    if (this.watchMode) {
      process.on('SIGINT', this.stopProcess);
      process.on('exit', this.stopProcess);
      process.on('uncaughtException', this.stopProcess);
    }

    await waitUntilUsed(this.port, 100, 10000);
  }

  public onComplete() {
    if (!this.watchMode) {
        this.stopProcess();
    }
  }

  private stopProcess() {
    if (this.process && !this.process.killed) {
        process.stdout.write('Shutting down wiremock\n');
        this.process.kill('SIGTERM');
    }
  }
}
