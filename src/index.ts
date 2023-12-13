import fs from 'fs';
import {parse} from 'node-html-parser';

enum Quality {
	FHD = '1920x1080',
	HD = '1280x720',
}

class AnimeInfo {
	constructor(public title: string, public downloadLink: string, public quality: Quality) {}
}

export class Animelayer {
	baseUrl = 'http://animelayer.ru';

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

	async download(link: string) {
		const response = await fetch(link, {
			headers: {
				cookie: this.cookie,
			},
		});

		return (await response.blob()).arrayBuffer();
	}

	async downloadEntry(entry: AnimeInfo) {
		return this.download(entry.downloadLink);
	}
}
