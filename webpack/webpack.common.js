const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, '..', './src/index.js'),
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, '..', 'public'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ]
  },
  resolve: { extensions: ['.js'] },
  plugins: [
    new HtmlWebpackPlugin({ template: './src/index.html' }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/images', to: 'images' },
      ],
    }),
  ],
};