import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import type { Options, Capabilities, WdioConfig } from './common/types';

export abstract class Plugin {
	protected readonly args: Array<string>;
	protected readonly port: number;
	protected readonly url: string;
	protected readonly skipWiremockInstall: boolean;
	protected readonly watchMode: boolean;
	protected readonly binPath: string;
	protected readonly silent: boolean;

	constructor(options: Options = {}, capabilities?: Capabilities, config?: WdioConfig) {
		const args = options.args || [];
		const version = options.version || '2.27.2';
		const rootDir = options.rootDir || 'wiremock';

		if (!existsSync(rootDir)) {
			mkdirSync(rootDir, { recursive: true });
		}

		if (args.includes('-port')) {
			throw new Error('Cannot set port using args. Use options.port instead.');
		}

		if (args.includes('-root-dir')) {
			throw new Error('Cannot set root-dir using args. Use options.rootDir instead.');
		}

		this.silent = !!options.silent;
		this.watchMode = !!config?.watch;
		this.binPath = resolve(__dirname, `wiremock-standalone-${version}.jar`);
		this.port = options.port || 8080;
		this.skipWiremockInstall = !!options.skipWiremockInstall;
		this.args = ['-jar', this.binPath, '-port', this.port.toString(), '-root-dir', rootDir].concat(args);
		this.url =
			`${options.mavenBaseUrl || 'https://repo1.maven.org/maven2'}` +
			`/com/github/tomakehurst/wiremock-standalone/${version}/wiremock-standalone-${version}.jar`;
	}
}
