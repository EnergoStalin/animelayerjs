import {Animelayer} from '../build/index.mjs';
import fs from 'fs';

(async function () {
	const client = new Animelayer(fs.readFileSync('/home/alexv/Source/animelayerjs/cache/cookie').toString('ascii'));

	const list = await client.search('hiki', '1920x1080');

	await Promise.all(list.map(async e => e.getMagnetUri(client)));

	console.log(list);
})();
