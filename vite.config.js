// vite.config.js

import { defineConfig } from 'vite';

module.exports = defineConfig({
	root: 'src',
	publicDir: '../public',
	build: {
		outDir: '../dist'
	},
	css: {},
	resolve: {
		alias: {
			'~': 'node_modules/'
		}
	}
});
