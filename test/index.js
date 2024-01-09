import {AnimeLayer, Credentials} from 'animelayerjs';
import fs from 'node:fs';
import path from 'node:path';

try {
	const creds = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.animelayer.json')));

	process.env.ANIMELAYER_LOGIN = creds.login;
	process.env.ANIMELAYER_PASSWORD = creds.password;
} catch {}

(async function () {
	const client = new AnimeLayer(new Credentials(process.env.ANIMELAYER_LOGIN, process.env.ANIMELAYER_PASSWORD));

	const list = await client.searchWithMagnet('Oroka na Tenshi wa Akuma to Odoru', '1920x1080');

	console.log(list);
})();
