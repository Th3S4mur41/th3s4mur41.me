const path = require('path');
const glob = require('glob');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PurgecssPlugin = require('purgecss-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
	entry: {
		app: './src/index.js'
	},
	output: {
		filename: 'app.[hash].js',
		path: path.resolve(__dirname, 'dist'),
		assetModuleFilename: 'assets/[hash][ext]'
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src/'),
			'~': path.resolve(__dirname, 'node_modules/')
		},
		extensions: ['.js', '.scss']
	},
	module: {
		rules: [
			{
				test: /\.html$/i,
				loader: 'html-loader',
				options: {
					preprocessor: (content) => {
						return content
							.replace(/{currentYear}/g, new Date().getFullYear())
							.replace(/{currentLocalISODate}/g, new Date().toISOString().replace(/\.\d*Z/g, '+00:00'));
					}
				}
			},
			{
				test: /\.jsx?$/,
				loader: 'babel-loader',
				exclude: /node_modules/
			},
			{
				test: /\.css$/i,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
						options: {}
					},
					{
						loader: 'css-loader',
						options: {
							import: true,
							importLoaders: 1,
							sourceMap: true
						}
					},
					'postcss-loader'
				]
			},
			{
				test: /\.(png|svg|jpg|jpeg|gif|ico)$/i,
				type: 'asset/resource'
			},
			{
				test: /\.(woff|woff2)$/i,
				type: 'asset/resource'
			}
		]
	},
	plugins: [
		new CleanWebpackPlugin(),
		new CopyPlugin({
			patterns: [{ from: 'public', to: '.' }]
		}),
		new HtmlWebpackPlugin({
			template: 'src/index.html',
			filename: './index.html'
		}),
		new MiniCssExtractPlugin({
			filename: 'styles.[hash].css'
		}),
		new PurgecssPlugin({
			paths: glob.sync('src/**/*', { nodir: true })
		})
	]
};
