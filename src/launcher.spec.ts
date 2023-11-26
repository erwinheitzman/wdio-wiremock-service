const waitUntilUsed = jest.fn();
const waitUntilFree = jest.fn();
const existsSync = jest.fn();
const mockStdoutPipe = jest.fn();
const mockStderrPipe = jest.fn();
const spawn = jest.fn();

let defaultArgs: Array<string>;

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

jest.mock('./wiremock');

import { resolve } from 'path';
import { WiremockLauncher } from './launcher';
import { WireMock } from './wiremock';

beforeEach(() => {
	defaultArgs = ['-jar', resolve(__dirname, 'wiremock-3.3.1.jar'), '-port', '8080', '-root-dir', 'wiremock'];
	spawn.mockReturnValue({
		stdout: { pipe: mockStdoutPipe },
		stderr: { pipe: mockStderrPipe },
		on: jest.fn(),
	});
});

afterEach(() => {
	jest.resetAllMocks();
	jest.restoreAllMocks();
	jest.clearAllMocks();
});

it('should start the service when no options are passed', async () => {
	const instance = new WiremockLauncher();

	await instance.onPrepare();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(spawn).toHaveBeenCalledWith('java', defaultArgs, { detached: true });
});

it('should start the service when a empty options is passed', async () => {
	const instance = new WiremockLauncher({});

	await instance.onPrepare();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(spawn).toHaveBeenCalledWith('java', defaultArgs, { detached: true });
});

it('should run wiremock with custom port', async () => {
	const instance = new WiremockLauncher({ port: 9999 });
	defaultArgs[3] = '9999';

	await instance.onPrepare();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(spawn).toHaveBeenCalledWith('java', defaultArgs, { detached: true });
});

it('should run wiremock with custom rootDir', async () => {
	const instance = new WiremockLauncher({ rootDir: 'example' });
	defaultArgs[5] = 'example';

	await instance.onPrepare();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(spawn).toHaveBeenCalledWith('java', defaultArgs, { detached: true });
});

it('should run wiremock with silent mode', async () => {
	const instance = new WiremockLauncher({ silent: true });

	await instance.onPrepare();

	expect(instance['silent']).toEqual(true);
	expect(mockStdoutPipe).toHaveBeenCalledTimes(0);
	expect(mockStderrPipe).toHaveBeenCalledTimes(0);
});

it('should run wiremock without silent mode', async () => {
	const instance = new WiremockLauncher({ silent: false });

	await instance.onPrepare();

	expect(instance['silent']).toEqual(false);
	expect(mockStdoutPipe).toHaveBeenCalledTimes(1);
	expect(mockStderrPipe).toHaveBeenCalledTimes(1);
});

it('should run wiremock with custom mavenBaseUrl', async () => {
	const instance = new WiremockLauncher({ downloadUrl: 'example-url' });
	existsSync.mockReturnValue(false);

	await instance.onPrepare();

	expect(WireMock.download).toHaveBeenCalledWith('example-url', defaultArgs[1]);
	expect(spawn).toHaveBeenCalledTimes(1);
	expect(spawn).toHaveBeenCalledWith('java', defaultArgs, { detached: true });
});

it('should throw when WireMock.download rejects', async () => {
	const rejectedError = 'rejected!';
	const errorMessage = new Error(`Downloading WireMock failed: ${rejectedError}\n`);
	const instance = new WiremockLauncher();

	existsSync.mockReturnValue(false);
	(WireMock['download'] as jest.Mock).mockRejectedValue(rejectedError);

	await expect(instance.onPrepare()).rejects.toThrowError(errorMessage);
});

it('should not install wiremock when skipWiremockInstall is set to true', async () => {
	const instance = new WiremockLauncher({ skipWiremockInstall: true });

	await instance.onPrepare();

	expect(WireMock.download).toHaveBeenCalledTimes(0);
});

it('should install wiremock when skipWiremockInstall is set to false', async () => {
	const instance = new WiremockLauncher({ skipWiremockInstall: false });
	existsSync.mockReturnValue(false);

	await instance.onPrepare();

	expect(WireMock.download).toHaveBeenCalledTimes(1);
});

it('should concatenate the passed arguments with the required arguments', async () => {
	const args = ['--disable-http', '--bind-address', '0.0.0.0'];
	const instance = new WiremockLauncher({ args });

	await instance.onPrepare();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(spawn).toHaveBeenCalledWith('java', defaultArgs.concat(args), { detached: true });
});

it('should assign the stopProcess method to process.on when watchMode is active', async () => {
	const mockCallback = jest.fn();
	const mockProcessOn = jest.spyOn(process, 'on').mockImplementation(mockCallback);
	const instance = new WiremockLauncher({}, [{ browserName: 'chrome' }], { watch: true });

	await instance.onPrepare();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(mockProcessOn).toHaveBeenCalledTimes(3);
	expect(mockProcessOn.mock.calls[0][0]).toEqual('SIGINT');
	expect(mockProcessOn.mock.calls[1][0]).toEqual('exit');
	expect(mockProcessOn.mock.calls[2][0]).toEqual('uncaughtException');
	expect(mockCallback).toBeCalledTimes(3);
});

it('should not execute the stopProcess method on completion when watchMode is active', async () => {
	const instance = new WiremockLauncher({}, [{ browserName: 'chrome' }], { watch: true });
	instance['stopProcess'] = jest.fn();

	await instance.onComplete();

	expect(instance['stopProcess']).toHaveBeenCalledTimes(0);
});

it('should execute the stopProcess method on completion when watchMode is not active', async () => {
	const instance = new WiremockLauncher({}, [{ browserName: 'chrome' }], { watch: false });
	instance['stopProcess'] = jest.fn();

	await instance.onComplete();

	expect(instance['stopProcess']).toHaveBeenCalledTimes(1);
});

it('should throw when waitUntilUsed rejects', async () => {
	const instance = new WiremockLauncher();
	waitUntilUsed.mockRejectedValue(new Error('Error: timeout'));

	await expect(instance.onPrepare()).rejects.toThrowError('Error: timeout');
});

it('should throw when waitUntilFree rejects', async () => {
	const instance = new WiremockLauncher();
	waitUntilFree.mockRejectedValue(new Error('Error: timeout'));

	await expect(instance.onComplete()).rejects.toThrowError('Error: timeout');
});
