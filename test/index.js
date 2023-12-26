import {AnimeLayer, Credentials} from 'animelayerjs';
import {readFileSync} from 'fs';
import {join} from 'path';

(async function () {
	const credentials = JSON.parse(readFileSync(join(process.env.HOME, '.animelayer.json')).toString('ascii'));
	const client = new AnimeLayer(new Credentials(credentials.login, credentials.password));

	const list = await client.searchWithMagnet('Hikikomari Kyuuketsuki no Monmon', {quality: '1920x1080', episode: 10});

	console.log(list);
})();
