import { createWriteStream } from 'fs';
import { get } from 'https';
import type { IncomingMessage } from 'http';

export class WireMock {
	static async download(from: string, to: string) {
		process.stdout.write(`Downloading WireMock from ${from}\n`);
		const res = await this.httpRequest(from);
		return this.writeData(res, to);
	}

	private static writeData(data: IncomingMessage, to: string): Promise<void | Error> {
		return new Promise((resolve, reject) => {
			data.pipe(createWriteStream(to));
			data.on('end', () => resolve());
			data.on('error', () => reject(new Error('Could not write to ' + to)));
		});
	}

	private static httpRequest(url: string): Promise<IncomingMessage> {
		return new Promise((resolve, reject) => {
			const req = get(url, (res) => {
				if (res.statusCode !== 200) {
					return reject(new Error('statusCode=' + res.statusCode));
				}

				return resolve(res);
			});

			req.on('error', (err) => {
				reject(err);
			});

			req.end();
		});
	}
}
