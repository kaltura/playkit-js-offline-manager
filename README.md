# Playkit JS Offline Manager

# Deprecated

## `NOTE`: This plugin is not mantained any more

[![Build Status](https://github.com/kaltura/playkit-js-offline-manager/actions/workflows/run_canary_full_flow.yaml/badge.svg)](https://github.com/kaltura/playkit-js-offline-manager/actions/workflows/run_canary_full_flow.yaml)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![](https://img.shields.io/npm/v/@playkit-js/playkit-js-offline-manager/latest.svg)](https://www.npmjs.com/package/@playkit-js/playkit-js-ima)
[![](https://img.shields.io/npm/v/@playkit-js/playkit-js-offline-manager/canary.svg)](https://www.npmjs.com/package/@playkit-js/playkit-js-offline-manager/v/canary)

PlayKit JS Offline Manager is a javascript library that gives the ability to store and manage content locally. The offline manager provides an API to control the entire download process (download, resume, pause, cancel) and to delete stored content. The offline manager supports storing both clear and protected content.

PlayKit JS  Offline Manager is written in [ECMAScript6], analyzed statically using [Flow], and transpiled in ECMAScript5 using [Babel].

[Flow]: https://flow.org/
[ECMAScript6]: https://github.com/ericdouglas/ES6-Learning#articles--tutorials
[Babel]: https://babeljs.io

## Table of Contents

  * [Getting Started](#getting-started)
    + [Installing](#installing)
    + [Building](#building)
  * [Documentation](#documentation)
  * [Running the Tests](#running-the-tests)
  * [Compatibility](#compatibility)
  * [Contributing](#contributing)
  * [Versioning](#versioning)
  * [License](#license)

## Getting Started


### Installing

First, clone and run [yarn] to install dependencies:

[yarn]: https://yarnpkg.com/lang/en/

```
git clone https://github.com/kaltura/playkit-js-offline-manager.git
cd playkit-js-offline-manager
yarn install
```

### Building

Next, build the player:

```javascript
yarn run build
```

## Documentation  

Refer to this documention for more information:
- **[Getting started](docs/gettingStarted.md)**
- **[API](docs/api.md)**

## Running the Tests

Tests can be run locally via [Karma], which will run on Chrome, Firefox and Safari browsers.

[Karma]: https://karma-runner.github.io/1.0/index.html
```
yarn run test
```

You can test individual browsers:
```
yarn run test:chrome
yarn run test:firefox
yarn run test:safari
```

### Coding Style Tests

We use ESLint [recommended set](http://eslint.org/docs/rules/) with some additions for enforcing [Flow] types and other rules.

See [ESLint config](.eslintrc.json) for complete configuration.

We also use [.editorconfig](.editorconfig) to maintain consistent coding styles and settings; please make sure you comply with the styling listed there.


## Compatibility

|  | IE | Edge| Firefox| Chrome| Safari | Safari IOS| Firefox/Chrome IOS| Chrome for Android|
|--|--| --|--|--|--|--|--|--|--|--|
| Clear Content Download | +* | +* |+*|+|+*|+*|+*|+||
| Protected Content Download | - | - |+*|+|+*|-|-|+||
|Background fetch download (under development)|-|-|-|-|-|-|-|-|-|-|+|

 (+) Tested
 (+*) Should work, not tested on this platform

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/kaltura/playkit-js/tags).

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE.md](LICENSE.md) file for details
