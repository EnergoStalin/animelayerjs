import {AnimeLayer, LoginPasswordCredentials} from 'animelayerjs';

(async function () {
	const client = new AnimeLayer(new LoginPasswordCredentials(process.env.ANIMELAYER_LOGIN, process.env.ANIMELAYER_PASSWORD));

	const list = await client.searchWithMagnet('Hikikomari Kyuuketsuki no Monmon', '1920x1080');

	console.log(list);
})();
