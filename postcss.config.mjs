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
	},
});
