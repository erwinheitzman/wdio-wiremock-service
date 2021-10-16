const createWriteStream = jest.fn();
const downloadUrl = 'download-url';
const targetPath = 'target-path';
const dummyData = 'dummy-data';

jest.mock('fs', () => ({
	createWriteStream,
}));

import { WireMock } from './wiremock';

WireMock['httpRequest'] = jest.fn();
WireMock['writeData'] = jest.fn();
process.stdout.write = jest.fn();

beforeEach(() => {
	(WireMock['httpRequest'] as jest.Mock).mockResolvedValue(dummyData);
});

afterEach(() => {
	jest.resetAllMocks();
	jest.restoreAllMocks();
	jest.clearAllMocks();
});

it('should log a download message', async () => {
	await WireMock.download(downloadUrl, targetPath);
	expect(process.stdout.write).toHaveBeenCalledWith(
		`Downloading WireMock standalone from Maven Central...\n  ${downloadUrl}\n`
	);
});

it('should write data', async () => {
	await WireMock.download(downloadUrl, targetPath);
	expect(WireMock['httpRequest']).toHaveBeenCalledWith(downloadUrl);
	expect(WireMock['writeData']).toHaveBeenCalledWith(dummyData, targetPath);
});

it('should reject and throw error', async () => {
	(WireMock['httpRequest'] as jest.Mock).mockRejectedValue('rejected!');
	try {
		await WireMock.download(downloadUrl, targetPath);
	} catch (error) {
		expect(error).toEqual('rejected!');
	}
});

it('should resolve without a value', async () => {
	WireMock['httpRequest'] as jest.Mock;
	const res = await WireMock.download(downloadUrl, targetPath);
	expect(res).toEqual(undefined);
});
