'use strict';

const webpack = require("webpack");
const path = require("path");
const PROD = (process.env.NODE_ENV === 'production');
const packageData = require("./package.json");

const plugins = [
  new webpack.DefinePlugin({
    __VERSION__: JSON.stringify(packageData.version),
    __NAME__: JSON.stringify(packageData.name)
  })
];

if (PROD) {
  plugins.push(new webpack.optimize.UglifyJsPlugin({sourceMap: true}));
} else {
  plugins.push(new CopyWebpackPlugin([{
    from: '',
    to: '.'
  }]));
}

module.exports = {
  context: __dirname + "/src",
  entry: {
    "playkit-offline-manager": "index.js"
  },
  output: {
    path: __dirname + "/dist",
    filename: '[name].js',
    library: ["KalturaPlayer", "OfflineManager"],
    libraryExport: "default",
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
    modules: [
      path.resolve(__dirname, "src"),
      "node_modules"
    ]
  },
  externals: {
    "playkit-js": {
      commonjs: "playkit-js",
      commonjs2: "playkit-js",
      amd: "playkit-js",
      root: ["KalturaPlayer", "core"]
    },
    "shaka-player": {
      commonjs: "shaka-player",
      commonjs2: "shaka-player",
      amd: "shaka-player",
      root: ["KalturaPlayer", "shaka"]
    },
    "playkit-js-providers": {
      commonjs: "playkit-js-providers",
      commonjs2: "playkit-js-providers",
      amd: "playkit-js-providers",
      root: ["KalturaPlayer", "providers"]
    }
  }
};
