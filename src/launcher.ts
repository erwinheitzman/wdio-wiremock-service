import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { get } from 'https';
import { resolve } from 'path';
import { spawn, ChildProcess, StdioOptions } from 'child_process';
import { waitUntilUsed, waitUntilFree } from 'tcp-port-used';
import { IncomingMessage } from 'http';

function httpRequest(url: string): Promise<IncomingMessage> {
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

export interface Options {
    port?: number;
    rootDir?: string;
    stdio?: StdioOptions;
    mavenBaseUrl?: string;
    args?: Array<any>;
    version?: string;
    skipWiremockInstall?: boolean;
}

export type Capabilities = Array<{ [key: string]: any }> | { [key: string]: { [key: string]: any } };

export interface WdioConfig {
    watch?: boolean;
}

export interface SpawnOptions {
    detached: boolean;
    stdio: StdioOptions;
}

export class WiremockLauncher {
    args: Array<any>;
    port: number;
    spawnOptions: { stdio: StdioOptions; detached: boolean };
    url: string;
    skipWiremockInstall: boolean;
    watchMode: boolean;
    binPath: string;
    process!: ChildProcess | null;

    constructor(options: Options = {}, capabilities?: Capabilities, config?: WdioConfig) {
        const port = options.port || 8080;
        const rootDir = options.rootDir || 'wiremock';
        const stdio = options.stdio || 'inherit';
        const mavenBaseUrl = options.mavenBaseUrl || 'https://repo1.maven.org/maven2';
        const skipWiremockInstall = options.skipWiremockInstall || false;
        const args = options.args || [];
        const version = options.version || '2.26.3';
        const binPath = resolve(__dirname, `wiremock-standalone-${version}.jar`);

        if (!existsSync(rootDir)) {
            mkdirSync(rootDir, { recursive: true });
        }

        if (args.includes('-port')) {
            throw new Error('Cannot set port using args. Use options.port instead.');
        }

        if (args.includes('-root-dir')) {
            throw new Error('Cannot set root-dir using args. Use options.rootDir instead.');
        }

        this.watchMode = Boolean(config?.watch);
        this.binPath = binPath;
        this.port = port;
        this.spawnOptions = { stdio, detached: true };
        this.url = `${mavenBaseUrl}/com/github/tomakehurst/wiremock-standalone/${version}/wiremock-standalone-${version}.jar`;
        this.skipWiremockInstall = !!skipWiremockInstall;
        this.args = args;
        this.args = this.args.concat(['-jar', binPath]);
        this.args = this.args.concat(['-port', port]);
        this.args = this.args.concat(['-root-dir', rootDir]);
    }

    async onPrepare() {
        if (!existsSync(this.binPath) && !this.skipWiremockInstall) {
            const error = await this.installFile(this.url, this.binPath);
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
            process.on('SIGINT', () => this.stopProcess(this.port));
            process.on('exit', () => this.stopProcess(this.port));
            process.on('uncaughtException', () => this.stopProcess(this.port));
        }

        await waitUntilUsed(this.port, 100, 10000);
    }

    async onComplete() {
        if (!this.watchMode) {
            await this.stopProcess(this.port);
        }
    }

    private async stopProcess(port: number) {
        if (!this.process?.killed) {
            process.stdout.write('Shutting down wiremock\n');
            this.process?.kill('SIGTERM');
        }

        await waitUntilFree(port, 100, 10000);
    }

    async installFile(from: string, to: string): Promise<IncomingMessage> {
        process.stdout.write(`Downloading WireMock standalone from Maven Central...\n  ${this.url}\n`);
        const res = await httpRequest(from);

        return new Promise((resolve, reject) => {
            res.pipe(createWriteStream(to));
            res.on('end', () => resolve());
            res.on('error', () => reject(new Error('Could not write to ' + to)));
        });
    }
}
