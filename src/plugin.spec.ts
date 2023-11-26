const resolve = jest.fn();
const existsSync = jest.fn();
const mkdirSync = jest.fn();

let instance;

jest.mock('path', () => ({
	resolve,
}));

jest.mock('fs', () => ({
	existsSync,
	mkdirSync,
}));

import { WiremockLauncher } from './launcher';
import { WireMock } from './wiremock';

WireMock['download'] = jest.fn();

beforeEach(() => {
	instance = null;
});

afterEach(() => {
	jest.resetAllMocks();
	jest.restoreAllMocks();
	jest.clearAllMocks();
});

it('should have default port', () => {
	instance = new WiremockLauncher();
	expect(instance['port']).toEqual(8080);
});

it('should assign custom port', () => {
	instance = new WiremockLauncher({ port: 9999 });
	expect(instance['port']).toEqual(9999);
});

it('should have default rootDir', () => {
	existsSync.mockReturnValue(false);
	instance = new WiremockLauncher();
	expect(mkdirSync).toHaveBeenCalledWith('wiremock', { recursive: true });
});

it('should assign custom rootDir', () => {
	existsSync.mockReturnValue(false);
	instance = new WiremockLauncher({ rootDir: 'example' });
	expect(mkdirSync).toHaveBeenCalledWith('example', { recursive: true });
});

it('should have silent mode set to false', () => {
	instance = new WiremockLauncher();
	expect(instance['silent']).toEqual(false);
});

it('should assign silent mode', () => {
	instance = new WiremockLauncher({ silent: true });
	expect(instance['silent']).toEqual(true);
});

it('should have default url', () => {
	instance = new WiremockLauncher();
	expect(instance['url']).toEqual(
		'https://repo1.maven.org/maven2/org/wiremock/wiremock-standalone/3.3.1/wiremock-standalone-3.3.1.jar',
	);
});

it('should assign custom url', () => {
	instance = new WiremockLauncher({ downloadUrl: 'custom-url' });
	expect(instance['url']).toEqual('custom-url');
});

it('should assign version to url', () => {
	const customVersion = '9.9.999';
	instance = new WiremockLauncher({ version: customVersion });
	expect(instance['url']).toEqual(
		`https://repo1.maven.org/maven2/org/wiremock/wiremock-standalone/${customVersion}/wiremock-standalone-${customVersion}.jar`,
	);
});

it('should assign false to watchMode', () => {
	instance = new WiremockLauncher({}, [{ browserName: 'chrome' }], { watch: false });
	expect(instance['watchMode']).toEqual(false);
});

it('should assign true to watchMode', () => {
	instance = new WiremockLauncher({}, [{ browserName: 'chrome' }], { watch: true });
	expect(instance['watchMode']).toEqual(true);
});

it('should assign binary path to binPath', () => {
	resolve.mockReturnValue('dummy');
	instance = new WiremockLauncher();
	expect(resolve).toHaveBeenCalledWith(__dirname, `wiremock-3.3.1.jar`);
	expect(instance['binPath']).toEqual('dummy');
});

it('should assign false to skipWiremockInstall', () => {
	instance = new WiremockLauncher({ skipWiremockInstall: false });
	expect(instance['skipWiremockInstall']).toEqual(false);
});

it('should assign true to skipWiremockInstall', () => {
	instance = new WiremockLauncher({ skipWiremockInstall: true });
	expect(instance['skipWiremockInstall']).toEqual(true);
});

it('should have default args', () => {
	resolve.mockReturnValue('dummy');
	instance = new WiremockLauncher();
	expect(instance['args']).toEqual(['-jar', 'dummy', '-port', '8080', '-root-dir', 'wiremock']);
});

it('should assign args', () => {
	resolve.mockReturnValue('dummy');
	instance = new WiremockLauncher({ port: 9999, rootDir: 'dummy-dir', args: ['--test', 'test'] });
	expect(instance['args']).toEqual(['-jar', 'dummy', '-port', '9999', '-root-dir', 'dummy-dir', '--test', 'test']);
});

it('should throw error when trying to set port using the args', () => {
	expect(() => new WiremockLauncher({ args: ['-port', '9999'] })).toThrowError(
		'Cannot set port using args. Use options.port instead.',
	);
});

it('should throw error when  to set root-dir using the args', () => {
	expect(() => new WiremockLauncher({ args: ['-root-dir', 'dummy'] })).toThrowError(
		'Cannot set root-dir using args. Use options.rootDir instead.',
	);
});
