import {AnimeLayer} from 'animelayerjs';
import fs from 'fs';

(async function () {
	const client = new AnimeLayer(fs.readFileSync('/home/alexv/Source/animelayerjs/cache/cookie').toString('ascii'));

	const list = await client.search('Hikikomari Kyuuketsuki no Monmon', '1920x1080');

	await Promise.all(list.map(async e => e.getMagnetUri(client)));

	console.log(list);
})();
