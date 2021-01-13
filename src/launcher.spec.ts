const waitUntilUsed = jest.fn();
const waitUntilFree = jest.fn();
const existsSync = jest.fn();
const mockStdoutPipe = jest.fn();
const mockStderrPipe = jest.fn();
const spawn = jest.fn();

let defaultArgs: Array<string>;
let instance: WiremockLauncher | null;

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
import { WiremockLauncher } from './launcher';
import { WireMock } from './wiremock';

WireMock['download'] = jest.fn();

beforeEach(() => {
	defaultArgs = [
		'-jar',
		resolve(__dirname, 'wiremock-standalone-2.27.2.jar'),
		'-port',
		'8080',
		'-root-dir',
		'wiremock',
	];
	instance = null;
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
	instance = new WiremockLauncher();

	await instance.onPrepare();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(spawn).toHaveBeenCalledWith('java', defaultArgs, { detached: true });
});

it('should start the service when a empty options is passed', async () => {
	instance = new WiremockLauncher({});

	await instance.onPrepare();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(spawn).toHaveBeenCalledWith('java', defaultArgs, { detached: true });
});

it('should run wiremock with custom port', async () => {
	instance = new WiremockLauncher({ port: 9999 });
	defaultArgs[3] = '9999';

	await instance.onPrepare();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(spawn).toHaveBeenCalledWith('java', defaultArgs, { detached: true });
});

it('should run wiremock with custom rootDir', async () => {
	instance = new WiremockLauncher({ rootDir: 'example' });
	defaultArgs[5] = 'example';

	await instance.onPrepare();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(spawn).toHaveBeenCalledWith('java', defaultArgs, { detached: true });
});

it('should run wiremock with silent mode', async () => {
	instance = new WiremockLauncher({ silent: true });

	await instance.onPrepare();

	expect(instance['silent']).toEqual(true);
	expect(mockStdoutPipe).toHaveBeenCalledTimes(0);
	expect(mockStderrPipe).toHaveBeenCalledTimes(0);
});

it('should run wiremock without silent mode', async () => {
	instance = new WiremockLauncher({ silent: false });

	await instance.onPrepare();

	expect(instance['silent']).toEqual(false);
	expect(mockStdoutPipe).toHaveBeenCalledTimes(1);
	expect(mockStderrPipe).toHaveBeenCalledTimes(1);
});

it('should run wiremock with custom mavenBaseUrl', async () => {
	const url = 'maven-url/com/github/tomakehurst/wiremock-standalone/2.27.2/wiremock-standalone-2.27.2.jar';
	instance = new WiremockLauncher({ mavenBaseUrl: 'maven-url' });
	existsSync.mockReturnValue(false);

	await instance.onPrepare();

	expect(WireMock.download).toHaveBeenCalledWith(url, defaultArgs[1]);
	expect(spawn).toHaveBeenCalledTimes(1);
	expect(spawn).toHaveBeenCalledWith('java', defaultArgs, { detached: true });
});

it('should throw when WireMock.download rejects', async () => {
	const rejectedError = 'rejected!';
	const errorMessage = `Downloading WireMock jar from Maven Central failed: ${rejectedError}\n`;
	instance = new WiremockLauncher();
	existsSync.mockReturnValue(false);
	(WireMock['download'] as jest.Mock).mockRejectedValue(rejectedError);

	try {
		await instance.onPrepare();
	} catch (error) {
		expect(error).toEqual(new Error(errorMessage));
	}
});

it('should not install wiremock when skipWiremockInstall is set to true', async () => {
	instance = new WiremockLauncher({ skipWiremockInstall: true });

	await instance.onPrepare();

	expect(WireMock.download).toHaveBeenCalledTimes(0);
});

it('should install wiremock when skipWiremockInstall is set to false', async () => {
	instance = new WiremockLauncher({ skipWiremockInstall: false });
	existsSync.mockReturnValue(false);

	await instance.onPrepare();

	expect(WireMock.download).toHaveBeenCalledTimes(1);
});

it('should concatenate the passed arguments with the required arguments', async () => {
	const args = ['--disable-http', '--bind-address', '0.0.0.0'];
	instance = new WiremockLauncher({ args });

	await instance.onPrepare();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(spawn).toHaveBeenCalledWith('java', defaultArgs.concat(args), { detached: true });
});

it('should assign the stopProcess method when watchMode is active', async () => {
	const callbacks: any[] = [];
	const mockProcessOn = jest.spyOn(process, 'on').mockImplementation((a: string | symbol, b: unknown): any => {
		callbacks.push(b);
	});
	instance = new WiremockLauncher({}, [{ browserName: 'chrome' }], { watch: true });
	instance['stopProcess'] = jest.fn();

	await instance.onPrepare();
	for (const callback of callbacks) {
		callback();
	}

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(mockProcessOn).toHaveBeenCalledTimes(3);
	expect(mockProcessOn.mock.calls[0][0]).toEqual('SIGINT');
	expect(mockProcessOn.mock.calls[1][0]).toEqual('exit');
	expect(mockProcessOn.mock.calls[2][0]).toEqual('uncaughtException');
	expect(instance['stopProcess']).toBeCalledTimes(3);
});

it('should not execute the stopProcess method on completion when watchMode is active', async () => {
	instance = new WiremockLauncher({}, [{ browserName: 'chrome' }], { watch: true });
	instance['stopProcess'] = jest.fn();

	await instance.onPrepare();
	instance.onComplete();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(instance['stopProcess']).toHaveBeenCalledTimes(0);
});

it('should execute the stopProcess method on completion when watchMode is not active', async () => {
	instance = new WiremockLauncher({}, [{ browserName: 'chrome' }], { watch: false });
	instance['stopProcess'] = jest.fn();

	await instance.onPrepare();
	instance.onComplete();

	expect(spawn).toHaveBeenCalledTimes(1);
	expect(instance['stopProcess']).toHaveBeenCalledTimes(1);
});

it('should throw when waitUntilUsed rejects', async () => {
	instance = new WiremockLauncher();
	waitUntilUsed.mockRejectedValue(new Error('Error: timeout'));

	await expect(instance.onPrepare()).rejects.toThrowError('Error: timeout');
});

it('should throw when waitUntilFree rejects', async () => {
	instance = new WiremockLauncher();
	waitUntilFree.mockRejectedValue(new Error('Error: timeout'));

	await expect(instance.onComplete()).rejects.toThrowError('Error: timeout');
});
