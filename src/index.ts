import fs from 'fs';
import {parse} from 'node-html-parser';
import parseTorrent, {toMagnetURI} from 'parse-torrent';

type Quality = keyof {
	'1920x1080': any;
	'1280x720': any;
};

class AnimeInfo {
	public magnetUri: string | undefined;
	public hash: string | undefined;
	public episodeRange = {
		first: 0,
		last: 0,
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
		return this.episodeRange.first >= episode && this.episodeRange.last <= episode;
	}

	async torrent() {
		if (this.#torrent) {
			return this.#torrent;
		}

		const response = await fetch(this.downloadLink, {
			headers: this.client.authHeaders,
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

export class AnimeLayer {
	private get baseUrl() {
		return 'http://animelayer.ru';
	}

	constructor(private readonly cookie: string) { }

	get authHeaders() {
		return {
			cookie: this.cookie,
		};
	}

	async search(anime: string, quality: Quality) {
		const url = `${this.baseUrl}/torrents/anime/?q=${encodeURIComponent(anime)}`;
		const response = await fetch(url, {
			headers: {
				cookie: this.cookie,
			},
		});

		const text = await response.text();
		const dom = parse(text);
		const torrents = Array.from(dom.querySelectorAll('li.torrent-item'));

		return torrents.filter(e => e.text.includes(quality))
			.map(e => {
				const link = e.querySelector('h3 > a')!;
				const info = e.querySelector('div.info')!.textContent.split('|');
				const [seed, leech, size] = info.map(e => e.trim());

				return new AnimeInfo(
					this,
					link.text,
					`${this.baseUrl}${link.getAttribute('href')}download`,
					parseInt(seed!, 10),
					parseInt(leech!, 10),
					size!,
					quality,
				);
			});
	}

	async searchWithMagnet(anime: string, quality: Quality) {
		const list = await this.search(anime, quality);

		await Promise.all(list.map(async e => e.getMagnetUri()));

		return list;
	}
}
