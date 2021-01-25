const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = [
	{
		entry: './src/index.js',
		output: {
			filename: 'scripts.js',
			path: path.resolve(__dirname, 'dist')
		},
		plugins: [
			new CleanWebpackPlugin(),
			new HtmlWebpackPlugin({
				template: 'src/index.html'
			})
		],
		module: {
			rules: [
				{
					test: /\.s[ac]ss$/i,
					use: [
						'style-loader',
						{
							loader: 'css-loader',
							options: {
								sourceMap: true
							}
						},
						{
							loader: 'sass-loader',
							options: {
								sourceMap: true
							}
						},
						'postcss-loader'
					]
				}
			]
		}
	}
];
