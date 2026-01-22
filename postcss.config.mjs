export default () => {
	return {
		plugins: {
			"postcss-nesting": {},
			autoprefixer: {},
			"@csstools/postcss-oklab-function": {},
			"postcss-preset-env": {
				preserve: true,
				features: {
					"media-query-ranges": true,
				},
			},
			cssnano: {
				preset: [
					"default",
					{
						discardComments: {
							removeAll: true,
						},
					},
				],
			},
		},
	};
};
