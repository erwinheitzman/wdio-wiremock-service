import { existsSync } from 'fs';
import { spawn } from 'child_process';
import { waitUntilUsed, waitUntilFree } from 'tcp-port-used';
import { WireMock } from './wiremock';
import { Plugin } from './plugin';
import { Options, Capabilities, WdioConfig } from './common/types';

export class WiremockLauncher extends Plugin {
	constructor(options: Options = {}, capabilities?: Capabilities, config?: WdioConfig) {
		super(options, capabilities, config);
	}

	async onPrepare() {
		if (!existsSync(this.binPath) && !this.skipWiremockInstall) {
			try {
				await WireMock.download(this.url, this.binPath);
			} catch (error) {
				throw new Error(`Downloading WireMock jar from Maven Central failed: ${error}\n`);
			}
		}

		this.process = spawn('java', this.args, this.spawnOptions);

		this.process.on('error', (error) => {
			process.stderr.write(error.message);
		});

		this.process.on('exit', () => {
			process.stdout.write(`Wiremock exited\n\n`);
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
			this.process?.kill();
		}

		await waitUntilFree(port, 100, 10000);
	}
}
