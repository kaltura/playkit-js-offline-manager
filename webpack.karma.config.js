'use strict';

const webpack = require("webpack");

const path = require("path");
const PROD = (process.env.NODE_ENV === 'production');
const packageData = require("./package.json");

let plugins = [
  new webpack.DefinePlugin({
    __VERSION__: JSON.stringify(packageData.version),
    __NAME__: JSON.stringify(packageData.name)
  })
];

if (PROD) {
  plugins.push(new webpack.optimize.UglifyJsPlugin({sourceMap: true}));
}

module.exports = {
  context: __dirname + "/src",
  entry: {
    "playkit-offline-manager": "index.js"
  },
  output: {
    path: __dirname + "/dist",
    filename: '[name].js',
    library: ["playkit", "OfflineManager"],
    libraryTarget: "umd",
    devtoolModuleFilenameTemplate: "./offline-manager/[resource-path]"
  },
  devtool: 'source-map',
  plugins: plugins,
  module: {
    rules: [{
      test: /\.js$/,
      use: [{
        loader: "babel-loader"
      }],
      exclude: [
        /node_modules/
      ]
    }]
  },
  devServer: {
    contentBase: __dirname + "/src"
  },
  resolve: {
    alias: {
      'playkit-js-providers': path.resolve('./node_modules/playkit-js-providers/dist/playkit-ovp-provider')
    },
    modules: [
      path.resolve(__dirname, "src"),
      "node_modules"
    ]
  }
};
