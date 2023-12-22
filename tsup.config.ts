import {defineConfig} from 'tsup';

const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
	entry: ['src/index.ts'],
	sourcemap: isDev,
	clean: true,
	dts: true,
	minify: !isDev,
	format: ['esm'],
	target: ['node20'],
	outDir: 'build',
});
