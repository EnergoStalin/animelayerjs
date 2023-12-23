import {AnimeInfo, type Quality} from 'animeinfo';
import {type CredentialProvider} from 'auth';
import moment from 'moment';
import {parse} from 'node-html-parser';

export class AnimeLayer {
	private get baseUrl() {
		return 'http://animelayer.ru';
	}

	constructor(private readonly authProvider: CredentialProvider) { }

	async authHeaders() {
		return {
			cookie: await this.authProvider.getCookie(),
		};
	}

	async search(anime: string, quality: Quality) {
		const url = `${this.baseUrl}/torrents/anime/?q=${encodeURIComponent(anime)}`;
		const response = await fetch(url, {
			headers: await this.authHeaders(),
		});

		const text = await response.text();
		const dom = parse(text);
		const torrents = Array.from(dom.querySelectorAll('li.torrent-item'));

		return torrents.filter(e => e.text.includes(quality))
			.map(e => {
				const link = e.querySelector('h3 > a')!;
				const info = e.querySelector('div.info')!.textContent.split('|');
				const [seed, leech, size, uploader, updated] = info.map(e => e.trim());

				const date = moment(updated!.split('н:').pop(), ['DD MMMM YYYY в hh:mm', 'DD MMMM в hh:mm'], 'ru').toDate();

				return new AnimeInfo(
					this,
					link.text,
					`${this.baseUrl}${link.getAttribute('href')}download`,
					parseInt(seed!, 10),
					parseInt(leech!, 10),
					size!,
					uploader!,
					date,
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
