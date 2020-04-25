const waitUntilUsed = jest.fn().mockResolvedValue(true);
const spawn = jest.fn().mockReturnValue({ on: jest.fn() });

jest.mock('child_process', () => ({
    spawn: spawn,
}));

jest.mock('tcp-port-used', () => ({
    waitUntilUsed: waitUntilUsed,
}));

import { resolve } from 'path';
import { WiremockLauncher, SpawnOptions } from './launcher';

let defaultArgs: Array<any>;
let spawnOptions: SpawnOptions;

beforeEach(() => {
    defaultArgs = [
        '-jar',
        resolve(__dirname, 'wiremock-standalone-2.26.3.jar'),
        '-port',
        8080,
        '-root-dir',
        resolve(__dirname, './mock'),
    ];
    spawnOptions = { detached: true, stdio: 'inherit' };
});

afterEach(() => {
    jest.clearAllMocks();
});

it('should start the service when no options are passed', async () => {
    const launcher = new WiremockLauncher();
    launcher.installFile = jest.fn();

    await launcher.onPrepare({});

    expect(spawn).toHaveBeenCalledTimes(1);
    expect(spawn).toHaveBeenCalledWith('java', defaultArgs, spawnOptions);
});

it('should start the service when a empty options is passed', async () => {
    const launcher = new WiremockLauncher({});
    launcher.installFile = jest.fn();

    await launcher.onPrepare({});

    expect(spawn).toHaveBeenCalledTimes(1);
    expect(spawn).toHaveBeenCalledWith('java', defaultArgs, spawnOptions);
});

it('should assign custom port', async () => {
    const launcher = new WiremockLauncher({ port: 9999 });
    launcher.installFile = jest.fn();

    defaultArgs[3] = 9999;

    await launcher.onPrepare({});

    expect(spawn).toHaveBeenCalledTimes(1);
    expect(spawn).toHaveBeenCalledWith('java', defaultArgs, spawnOptions);
});

it('should assign custom rootDir', async () => {
    const launcher = new WiremockLauncher({ rootDir: 'example' });
    launcher.installFile = jest.fn();

    defaultArgs[5] = resolve(__dirname, 'example');

    await launcher.onPrepare({});

    expect(spawn).toHaveBeenCalledTimes(1);
    expect(spawn).toHaveBeenCalledWith('java', defaultArgs, spawnOptions);
});

it('should assign custom stdio', async () => {
    const launcher = new WiremockLauncher({ stdio: 'ignore' });
    launcher.installFile = jest.fn();

    await launcher.onPrepare({});

    expect(spawn).toHaveBeenCalledTimes(1);
    expect(spawn).toHaveBeenCalledWith('java', defaultArgs, { ...spawnOptions, stdio: 'ignore' });
});

it('should assign custom mavenBaseUrl', async () => {
    const url = 'maven-url/com/github/tomakehurst/wiremock-standalone/2.26.3/wiremock-standalone-2.26.3.jar';
    const launcher = new WiremockLauncher({ mavenBaseUrl: 'maven-url' });
    launcher.installFile = jest.fn();

    await launcher.onPrepare({});

    expect(launcher.installFile).toHaveBeenCalledWith(url, defaultArgs[1]);
    expect(spawn).toHaveBeenCalledTimes(1);
    expect(spawn).toHaveBeenCalledWith('java', defaultArgs, spawnOptions);
});

it('should not install wiremock when skipWiremockInstall is set to true', async () => {
    const launcher = new WiremockLauncher({ skipWiremockInstall: true });
    launcher.installFile = jest.fn();

    await launcher.onPrepare({});

    expect(launcher.installFile).toHaveBeenCalledTimes(0);
});

it('should install wiremock when skipWiremockInstall is set to false', async () => {
    const launcher = new WiremockLauncher({ skipWiremockInstall: false });
    launcher.installFile = jest.fn();

    await launcher.onPrepare({});

    expect(launcher.installFile).toHaveBeenCalledTimes(1);
});

// TODO: remove port setting and allow it to be passed as an argument
// check if having no port set, defaults to 8080
it('should concatenate the passed arguments with the required arguments', async () => {
    const args = ['--disable-http', '--bind-address', '0.0.0.0'];
    const launcher = new WiremockLauncher({ args });
    launcher.installFile = jest.fn();

    await launcher.onPrepare({});

    expect(spawn).toHaveBeenCalledTimes(1);
    expect(spawn).toHaveBeenCalledWith('java', args.concat(defaultArgs), spawnOptions);
});

it('should take into account wathchMode', async () => {
    const mockProcessOn = jest.spyOn(process, 'on').mockImplementation();
    const launcher = new WiremockLauncher();
    launcher.installFile = jest.fn();
    spawn.mockReturnValue({ on: jest.fn() });

    await launcher.onPrepare({ watch: true });

    expect(spawn).toHaveBeenCalledTimes(1);
    expect(mockProcessOn).toHaveBeenCalledTimes(3);
    expect(mockProcessOn.mock.calls[0]).toEqual(['SIGINT', launcher._stopProcess]);
    expect(mockProcessOn.mock.calls[1]).toEqual(['exit', launcher._stopProcess]);
    expect(mockProcessOn.mock.calls[2]).toEqual(['uncaughtException', launcher._stopProcess]);
});

it('should not execute the _stopProcess method on completion when watchMode is active', async () => {
    const launcher = new WiremockLauncher();
    launcher.installFile = jest.fn();
    launcher._stopProcess = jest.fn();
    spawn.mockReturnValue({ on: jest.fn() });

    await launcher.onPrepare({ watch: true });
    launcher.onComplete();

    expect(spawn).toHaveBeenCalledTimes(1);
    expect(launcher._stopProcess).toHaveBeenCalledTimes(0);
});

it('should execute the _stopProcess method on completion when watchMode is not active', async () => {
    const launcher = new WiremockLauncher();
    launcher.installFile = jest.fn();
    launcher._stopProcess = jest.fn();
    spawn.mockReturnValue({ on: jest.fn() });

    await launcher.onPrepare({ watch: false });
    launcher.onComplete();

    expect(spawn).toHaveBeenCalledTimes(1);
    expect(launcher._stopProcess).toHaveBeenCalledTimes(1);
});

it('should execute the _stopProcess method on completion when watchMode is not active', async () => {
    const launcher = new WiremockLauncher();
    launcher.installFile = jest.fn();
    launcher._stopProcess = jest.fn();
    spawn.mockReturnValue({ on: jest.fn() });

    await launcher.onPrepare({ watch: false });
    launcher.onComplete();

    expect(spawn).toHaveBeenCalledTimes(1);
    expect(launcher._stopProcess).toHaveBeenCalledTimes(1);
});
