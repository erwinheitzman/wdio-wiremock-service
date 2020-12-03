import { StdioOptions } from 'child_process';

interface Capability {
	[key: string]: any;
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

export interface WdioConfig {
	watch?: boolean;
	[key: string]: any;
}

export type Capabilities = Array<Capability> | { [key: string]: Capability };
