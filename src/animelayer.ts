import {AnimeInfo, type Quality} from 'animeinfo';
import {type CredentialProvider} from 'auth';
import {parse} from 'node-html-parser';

export declare type SearchOptions = {
	quality: Quality;
	episode?: number;
};

function isValidDate(d: Date) {
	// @ts-expect-error Date can be nan
	return d instanceof Date && !isNaN(d);
}

function parseDate(date: string) {
	const months = [
		'января',
		'февраля',
		'марта',
		'апреля',
		'мая',
		'июня',
		'июля',
		'августа',
		'сентября',
		'октября',
		'ноября',
		'декабря',
	];

	const parts = date.split(' ')
		.map(e => e.split(' '))
		.flat().filter(e => e);
	let day: string | undefined;
	let month: string | undefined;
	let year: string | undefined;
	let time: string | undefined;
	let _;

	if (parts.length === 5) {
		[day, month, year, _, time] = parts;
	}	else {
		[day, month, _, time] = parts;
	}

	const monthNum = months.findIndex(e => e === month);
	const yearNum = parseInt(year ?? `${new Date().getUTCFullYear()}`, 10);
	const [hours, minutes] = time!.split(':');

	return new Date(
		yearNum,
		monthNum,
		parseInt(day!, 10),
		parseInt(hours!, 10),
		parseInt(minutes!, 10),
		0,
		0,
	);
}

export class AnimeLayer {
	private get baseUrl() {
		return 'http://animelayer.ru';
	}

	constructor(
		private readonly authProvider: CredentialProvider,
	) {}

	async authHeaders() {
		return {
			cookie: await this.authProvider.getCookie(),
		};
	}

	async search(anime: string, options: SearchOptions) {
		const url = `${this.baseUrl}/torrents/anime/?q=${encodeURIComponent(anime)}`;
		const response = await fetch(url, {
			headers: await this.authHeaders(),
		});

		const text = await response.text();
		const dom = parse(text);
		const torrents = Array.from(dom.querySelectorAll('li.torrent-item'))
			.filter(e => e.text.includes(options.quality));

		const animeInfo = torrents
			.map(e => {
				const link = e.querySelector('h3 > a')!;
				const info = e.querySelector('div.info')!.textContent.split('|');
				const [seed, leech, size, uploader, updated] = info.map(e => e.trim());

				const date = parseDate(updated!.split('н:').pop()!);

				return new AnimeInfo(
					this,
					link.text,
					`${this.baseUrl}${link.getAttribute('href')}download`,
					parseInt(seed!, 10),
					parseInt(leech!, 10),
					size!,
					uploader!,
					date,
					options.quality,
				);
			});

		return options.episode ? animeInfo.filter(e => e.hasEpisode(options.episode!)) : animeInfo;
	}

	async searchWithMagnet(anime: string, options: SearchOptions) {
		const list = await this.search(anime, options);

		await Promise.all(list.map(async e => e.getMagnetUri()));

		return list;
	}
}
