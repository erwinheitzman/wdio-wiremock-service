const waitUntilUsed = jest.fn();
const waitUntilFree = jest.fn();
const existsSync = jest.fn();
const spawn = jest.fn().mockReturnValue({ on: jest.fn() });

jest.mock('child_process', () => ({
	spawn,
}));

jest.mock('tcp-port-used', () => ({
	waitUntilUsed,
	waitUntilFree,
}));

jest.mock('fs', () => ({
	existsSync,
	mkdirSync: jest.fn(),
}));

import { resolve } from 'path';
import { WiremockLauncher, Options, Capabilities, WdioConfig, SpawnOptions } from './launcher';

let defaultArgs: Array<any>;
let spawnOptions: SpawnOptions;
let options: Options;
let capabilities: Capabilities;
let wdioConfig: WdioConfig;

beforeEach(() => {
	options = {};
	capabilities = [{ browserName: 'chrome' }];
	wdioConfig = {};
	defaultArgs = ['-jar', resolve(__dirname, 'wiremock-standalone-2.26.3.jar'), '-port', 8080, '-root-dir', 'wiremock'];
	spawnOptions = { detached: true, stdio: 'inherit' };
});

afterEach(() => {
	jest.clearAllMocks();
});

it('should start the service when no options are passed', async () => {
	const launcher = new WiremockLauncher();
	launcher.installFile = jest.fn();

	await launcher.onPrepare();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(spawn).toHaveBeenCalledWith('java', defaultArgs, spawnOptions);
});

it('should start the service when a empty options is passed', async () => {
	const launcher = new WiremockLauncher(options);
	launcher.installFile = jest.fn();

	await launcher.onPrepare();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(spawn).toHaveBeenCalledWith('java', defaultArgs, spawnOptions);
});

it('should assign custom port', async () => {
	const launcher = new WiremockLauncher({ ...options, port: 9999 });
	launcher.installFile = jest.fn();
	defaultArgs[3] = 9999;

	await launcher.onPrepare();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(spawn).toHaveBeenCalledWith('java', defaultArgs, spawnOptions);
});

it('should assign custom rootDir', async () => {
	const launcher = new WiremockLauncher({ ...options, rootDir: 'example' });
	launcher.installFile = jest.fn();

	defaultArgs[5] = 'example';

	await launcher.onPrepare();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(spawn).toHaveBeenCalledWith('java', defaultArgs, spawnOptions);
});

it('should assign custom stdio', async () => {
	const launcher = new WiremockLauncher({ ...options, stdio: 'ignore' });
	launcher.installFile = jest.fn();

	await launcher.onPrepare();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(spawn).toHaveBeenCalledWith('java', defaultArgs, { ...spawnOptions, stdio: 'ignore' });
});

it('should assign custom mavenBaseUrl', async () => {
	const url = 'maven-url/com/github/tomakehurst/wiremock-standalone/2.26.3/wiremock-standalone-2.26.3.jar';
	const launcher = new WiremockLauncher({ ...options, mavenBaseUrl: 'maven-url' });
	launcher.installFile = jest.fn();
	existsSync.mockReturnValue(false);

	await launcher.onPrepare();

	expect(launcher.installFile).toHaveBeenCalledWith(url, defaultArgs[1]);
	expect(spawn).toHaveBeenCalledTimes(1);
	expect(spawn).toHaveBeenCalledWith('java', defaultArgs, spawnOptions);
});

it('should not install wiremock when skipWiremockInstall is set to true', async () => {
	const launcher = new WiremockLauncher({ ...options, skipWiremockInstall: true });
	launcher.installFile = jest.fn();

	await launcher.onPrepare();

	expect(launcher.installFile).toHaveBeenCalledTimes(0);
});

it('should install wiremock when skipWiremockInstall is set to false', async () => {
	const launcher = new WiremockLauncher({ ...options, skipWiremockInstall: false });
	launcher.installFile = jest.fn();
	existsSync.mockReturnValue(false);

	await launcher.onPrepare();

	expect(launcher.installFile).toHaveBeenCalledTimes(1);
});

it('should concatenate the passed arguments with the required arguments', async () => {
	const args = ['--disable-http', '--bind-address', '0.0.0.0'];
	const launcher = new WiremockLauncher({ ...options, args });
	launcher.installFile = jest.fn();

	await launcher.onPrepare();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(spawn).toHaveBeenCalledWith('java', defaultArgs.concat(args), spawnOptions);
});

it('should assign the stopProcess method when watchMode is active', async () => {
	const callbacks: any[] = [];
	const mockProcessOn = jest.spyOn(process, 'on').mockImplementation((a: any, b: any): any => {
		callbacks.push(b);
	});
	const launcher = new WiremockLauncher(options, capabilities, { ...wdioConfig, watch: true });
	launcher['stopProcess'] = jest.fn();
	launcher.installFile = jest.fn();
	spawn.mockReturnValue({ on: jest.fn() });

	await launcher.onPrepare();
	for (const callback of callbacks) {
		callback();
	}

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(mockProcessOn).toHaveBeenCalledTimes(3);
	expect(mockProcessOn.mock.calls[0][0]).toEqual('SIGINT');
	expect(mockProcessOn.mock.calls[1][0]).toEqual('exit');
	expect(mockProcessOn.mock.calls[2][0]).toEqual('uncaughtException');
	expect(launcher['stopProcess']).toBeCalledTimes(3);
});

it('should not execute the stopProcess method on completion when watchMode is active', async () => {
	const launcher = new WiremockLauncher(options, capabilities, { ...wdioConfig, watch: true });
	launcher.installFile = jest.fn();
	launcher['stopProcess'] = jest.fn();
	spawn.mockReturnValue({ on: jest.fn() });

	await launcher.onPrepare();
	launcher.onComplete();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(launcher['stopProcess']).toHaveBeenCalledTimes(0);
});

it('should execute the stopProcess method on completion when watchMode is not active', async () => {
	const launcher = new WiremockLauncher(options, capabilities, { ...wdioConfig, watch: false });
	launcher.installFile = jest.fn();
	launcher['stopProcess'] = jest.fn();
	spawn.mockReturnValue({ on: jest.fn() });

	await launcher.onPrepare();
	launcher.onComplete();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(launcher['stopProcess']).toHaveBeenCalledTimes(1);
});

it('should throw when waitUntilUsed rejects', async () => {
	const launcher = new WiremockLauncher();
	launcher.installFile = jest.fn();
	spawn.mockReturnValue({ on: jest.fn() });
	waitUntilUsed.mockRejectedValue(new Error('Error: timeout'));

	await expect(launcher.onPrepare()).rejects.toThrowError('Error: timeout');
});

it('should throw when waitUntilFree rejects', async () => {
	const launcher = new WiremockLauncher();
	waitUntilFree.mockRejectedValue(new Error('Error: timeout'));

	await expect(launcher.onComplete()).rejects.toThrowError('Error: timeout');
});

it('should throw error when trying to set port using the args', async () => {
	expect(() => new WiremockLauncher({ ...options, args: ['-port', 9999] })).toThrowError(
		'Cannot set port using args. Use options.port instead.',
	);
});

it('should throw error when  to set root-dir using the args', async () => {
	expect(() => new WiremockLauncher({ ...options, args: ['-root-dir', 'dummy'] })).toThrowError(
		'Cannot set root-dir using args. Use options.rootDir instead.',
	);
});
