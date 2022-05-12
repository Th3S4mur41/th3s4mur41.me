// vite.config.js

import { defineConfig } from 'vite';

module.exports = defineConfig({
	root: 'src',
	publicDir: '../public',
	build: {
		outDir: '../dist'
	},
	css: { postcss: './postcss.config.js' },
	resolve: {
		alias: {
			'~': 'node_modules/'
		}
	}
});
