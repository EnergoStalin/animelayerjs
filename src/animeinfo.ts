import parseTorrent, {toMagnetURI} from 'parse-torrent';
import {type AnimeLayer} from './animelayer';

export type Quality = keyof {
	'1920x1080': any;
	'1280x720': any;
};

export class AnimeInfo {
	public magnetUri: string | undefined;
	public hash: string | undefined;
	public episodeRange = {
		first: 0,
		last: 0,
		inRange(episode: number) {
			return episode >= this.first && episode <= this.last;
		},
	};

	#torrent: ArrayBuffer | undefined;

	// eslint-disable-next-line max-params
	constructor(
		private readonly client: AnimeLayer,
		public title: string,
		public downloadLink: string,
		public seed: number,
		public leech: number,
		public size: string,
		public uploader: string,
		public date: Date,
		public quality: Quality,
	) {
		this.parseEpisodeRange();
	}

	async getMagnetUri() {
		if (this.magnetUri) {
			return this.magnetUri;
		}

		const torrent = await this.torrent();

		// eslint-disable-next-line @typescript-eslint/await-thenable
		const parsed = await parseTorrent(Buffer.from(torrent));
		this.hash = parsed.infoHash;

		this.magnetUri = toMagnetURI(parsed);
		return this.magnetUri;
	}

	hasEpisode(episode: number) {
		return this.episodeRange.inRange(episode);
	}

	async torrent() {
		if (this.#torrent) {
			return this.#torrent;
		}

		const response = await fetch(this.downloadLink, {
			headers: await this.client.authHeaders(),
		});

		this.#torrent = await (await response.blob()).arrayBuffer();
		return this.#torrent;
	}

	private parseEpisodeRange() {
		const split = this.title.split(' ');

		let range = split.pop()!;
		if (!range.includes('(')) {
			range = split.pop()!;
		}

		// Get Rid of brackets
		const piledRange = range.slice(1, range.length - 1);

		const result = /(\d+).+?(\d+)/.exec(piledRange)!;
		if (piledRange.includes('из')) {
			this.episodeRange.first = 1;
			this.episodeRange.last = parseInt(result[1]!, 10);
		} else {
			this.episodeRange.first = parseInt(result[1]!, 10);
			this.episodeRange.last = parseInt(result[2]!, 10);
		}
	}
}
