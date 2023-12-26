import * as cookie from 'cookie';

export type CredentialProvider = {
	getCookie(): Promise<string>;
};

declare type Cookie = Array<Record<string, string>>;

export type CookieStore = {
	set cookie(value: Cookie);
	get cookie(): Cookie | undefined;

	set cookieString(value: string);
	get cookieString(): string | undefined;

	get issued(): Date;
};

export class DefaultCookieStore implements CookieStore {
	#cookie: Cookie | undefined;
	#cookieString: string | undefined;
	#issued: Date = new Date();

	get cookie(): Cookie | undefined {
		return this.#cookie;
	}

	set cookie(value: Cookie) {
		this.#cookie = value;
		this.#issued = new Date();
	}

	get cookieString(): string | undefined {
		return this.#cookieString;
	}

	set cookieString(value: string) {
		this.#cookieString = value;
		this.#issued = new Date();
	}

	get issued(): Date {
		return this.#issued;
	}
}

export class CookieCredentials implements CredentialProvider {
	constructor(private readonly cookie: string) {}

	async getCookie() {
		return this.cookie;
	}
}

export class Credentials implements CredentialProvider {
	constructor(
		private readonly login: string,
		private readonly password: string,
		private readonly store: CookieStore = new DefaultCookieStore(),
	) {}

	async getCookie() {
		if (this.expired()) {
			await this.refreshCookie();
		}

		return this.store.cookieString!;
	}

	private expired() {
		if (!this.store.cookie) {
			return true;
		}

		const seconds = parseInt(this.store.cookie[1]!['Max-Age']!, 10);
		return new Date().getTime() > (this.store.issued.getTime() + (seconds * 1000));
	}

	private async refreshCookie() {
		const res = await fetch('http://animelayer.ru/auth/login/', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
			},
			body: new URLSearchParams({
				login: this.login,
				password: this.password,
			}),
			redirect: 'manual',
		});

		if (res.headers.getSetCookie().length === 1) {
			throw new Error('Login failed', {cause: {url: res.url, status: res.status}});
		}

		this.store.cookie = res.headers.getSetCookie().map(e => cookie.parse(e));
		this.store.cookieString = this.stringifyCookie(this.store.cookie);
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
