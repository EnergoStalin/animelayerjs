import fs from 'fs';
import {parse} from 'node-html-parser';
import parseTorrent, {toMagnetURI} from 'parse-torrent';

type Quality = keyof {
	'1920x1080': any;
	'1280x720': any;
};

class AnimeInfo {
	public magnetUri: string | undefined;
	public episodeRange = {
		first: 0,
		last: 0,
	};

	constructor(public title: string, public downloadLink: string, public quality: Quality) {
		this.parseEpisodeRange();
	}

	async getMagnetUri(client: AnimeLayer) {
		if (this.magnetUri) {
			return this.magnetUri;
		}

		const torrent = await client.downloadTorrent(this.downloadLink);

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
		const parsed = await parseTorrent(Buffer.from(torrent));

		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
		this.magnetUri = toMagnetURI(parsed);
		return this.magnetUri;
	}

	hasEpisode(episode: number) {
		return this.episodeRange.first >= episode && this.episodeRange.last <= episode;
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

	constructor(private readonly cookie: string) {}

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

				return new AnimeInfo(link.text, `${this.baseUrl}${link.getAttribute('href')}download`, quality);
			});
	}

	async downloadTorrent(link: string) {
		const response = await fetch(link, {
			headers: {
				cookie: this.cookie,
			},
		});

		return (await response.blob()).arrayBuffer();
	}
}
