const isProduction = process.env.NODE_ENV === "production";

export default () => ({
	plugins: {
		"postcss-preset-env": {
			stage: 2,
			autoprefixer: true,
			preserve: true,
			features: {
				"nesting-rules": true,
				"media-query-ranges": true,
			},
		},
		...(isProduction
			? {
					cssnano: {
						preset: [
							"default",
							{
								calc: {
									warnWhenCannotResolve: false, // silence calc division warnings like em/2
								},
								discardComments: {
									removeAll: true,
								},
							},
						],
					},
				}
			: {}),
	},
});
