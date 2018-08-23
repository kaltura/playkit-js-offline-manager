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

const isWindows = /^win/.test(process.platform);
const isMacOS = /^darwin/.test(process.platform);
// Create custom launcher in case running with Travis
const customLaunchers = {
  Chrome_travis_ci: {
    base: 'Chrome',
    flags: ['--no-sandbox']
  }
};

module.exports = function (config) {
  let karmaConf = {
    logLevel: config.LOG_INFO,
    browsers: [
      'Chrome',
      'Firefox'
    ],
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

  if (process.env.TRAVIS) {
    karmaConf.customLaunchers = customLaunchers;
    karmaConf.browsers = [
      'Chrome_travis_ci'
    ];
  } else {
    if (isWindows) {
      karmaConf.browsers.push('IE');
    } else if (isMacOS) {
      karmaConf.browsers.push('Safari');
    }
  }

  config.set(karmaConf);
};
