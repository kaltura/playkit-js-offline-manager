let webpackConfig = require('./webpack.config.js');
//Need to remove externals otherwise they won't be included in test
delete webpackConfig.externals;
// Need to define inline source maps when using karma
webpackConfig.devtool = 'inline-source-map';

//this is here only beacuse we need to resolve the providers to either OVP or OTT
//once we move to seperate provider packages on NPM we can run tests with matrix and require both OVP and OTT
const path = require('path');
webpackConfig.resolve.alias = {
  'playkit-js-providers': path.resolve('./node_modules/playkit-js-providers/dist/playkit-ovp-provider')
};

// Create custom launcher in case running with Travis
const launchers = {
  Chrome_browser: {
    base: 'ChromeHeadless',
    flags: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
  }
};

module.exports = function (config) {
  let karmaConf = {
    logLevel: config.LOG_INFO,
    browsers: [],
    concurrency: 1,
    singleRun: true,
    colors: true,
    frameworks: [
      'mocha'
    ],
    files: [
      'test/setup/karma.js'
    ],
    preprocessors: {
      'src/**/*.js': [
        'webpack',
        'sourcemap'
      ],
      'test/setup/karma.js': [
        'webpack',
        'sourcemap'
      ]
    },
    reporters: [
      'progress',
      'coverage'
    ],
    webpack: webpackConfig,
    webpackServer: {
      noInfo: true
    },
    client: {
      mocha: {
        reporter: 'html',
        timeout: 50000
      }
    }
  };

  karmaConf.customLaunchers = launchers;
  karmaConf.browsers = ['Chrome_browser'];
  config.set(karmaConf);
};
