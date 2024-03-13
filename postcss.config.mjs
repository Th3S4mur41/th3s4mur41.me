export default (context) => {
	return {
		plugins: {
			"postcss-nesting": {},
			autoprefixer: {},
			"@csstools/postcss-oklab-function": {},
			"postcss-preset-env": {
				preserve: true,
			},
			cssnano: {
				preset: "default",
			},
		},
	};
};
