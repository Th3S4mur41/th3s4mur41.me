const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
	mode: 'development',
	devtool: 'inline-source-map',
	devServer: {
		contentBase: './dist',
		watchContentBase: true,
		disableHostCheck: true,
		inline: true,
		liveReload: true,
		hot: true
	}
});
