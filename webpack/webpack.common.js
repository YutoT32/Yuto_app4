const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, '..', 'src/index.js'),
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, '..', 'public'),
    clean: true,
  },
  resolve: {
    extensions: ['.js'],
  },
  plugins: [new HtmlWebpackPlugin({ template: './src/index.html' })],
};