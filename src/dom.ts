export async function parseDom(html: string): Promise<HTMLElement> {
	if (typeof window !== 'undefined') {
		const parser = new DOMParser();
		return parser.parseFromString(html, 'text/html') as unknown as HTMLElement;
	}

	const parser = await import('node-html-parser');
	return parser.parse(html) as unknown as HTMLElement;
}
