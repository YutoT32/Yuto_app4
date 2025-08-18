const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: path.resolve(__dirname, '..', 'src/index.js'),
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, '..', 'public'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader",{loader:"css-loader",options:{url:false}}]
      },
    ]
  },
  resolve: {
    extensions: ['.js'],
  },
  plugins: [new HtmlWebpackPlugin({ template: './src/index.html' })],
};