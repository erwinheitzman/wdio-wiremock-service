import { StdioOptions } from 'child_process';

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
}

export type Capabilities = Array<{ [key: string]: any }> | { [key: string]: { [key: string]: any } };
