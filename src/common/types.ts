interface Capability {
	[key: string]: unknown;
}

export interface Options {
	port?: number;
	rootDir?: string;
	mavenBaseUrl?: string;
	args?: Array<string>;
	version?: string;
	skipWiremockInstall?: boolean;
	silent?: boolean;
}

export interface WdioConfig {
	watch?: boolean;
	[key: string]: unknown;
}

export type Capabilities = Array<Capability> | { [key: string]: Capability };
