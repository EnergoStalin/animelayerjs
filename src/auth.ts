import * as cookie from 'cookie';
import moment from 'moment';

export type CredentialProvider = {
	getCookie(): Promise<string>;
};

export class CookieCredentials implements CredentialProvider {
	constructor(private readonly cookie: string) {}

	async getCookie() {
		return this.cookie;
	}
}

export class Credentials implements CredentialProvider {
	private cookie: Array<Record<string, string>> | undefined;
	private cookieString: string | undefined;

	constructor(private readonly login: string, private readonly password: string) {}

	async getCookie() {
		if (this.expired()) {
			await this.refreshCookie();
		}

		return this.cookieString!;
	}

	private expired() {
		if (!this.cookie) {
			return true;
		}

		const seconds = parseInt(this.cookie[1]!['Max-Age']!, 10);
		return moment().isAfter(moment().add(seconds, 's'));
	}

	private async refreshCookie() {
		const res = await fetch('http://animelayer.ru/auth/login/', {
			method: 'POST',
			body: new URLSearchParams({
				login: this.login,
				password: this.password,
			}),
			redirect: 'manual',
		});

		this.cookie = res.headers.getSetCookie().map(e => cookie.parse(e));
		this.cookieString = this.stringifyCookie(this.cookie);
	}

	private stringifyCookie(cookie: Array<Record<string, string>>) {
		const reduced = cookie.reduce((p, e) => {
			const [kv] = Object.entries(e);
			const [key, value] = kv!;

			return p + `${key}=${value}; `;
		}, '');
		return reduced.substring(0, reduced.length - 2);
	}
}
