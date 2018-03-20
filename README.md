# Playkit JS Offline Manager

PlayKit JS Offline Manager is a javascript library that gives the ability to store and manage content locally. The offline manager provide an API to control the whole download process (download, resume, pause, cancel) and delete already stored content.
It supports storing both clear and protected content.

PlayKit JS  Offline Manager is written in [ECMAScript6], statically analysed using [Flow] and transpiled in ECMAScript5 using [Babel].

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

Then, build the player

```javascript
yarn run build
```

## Documentation
- **[Getting started](docs/gettingStarted.md)**
- **[API](docs/api.md)**

## Running the Tests

Tests can be run locally via [Karma], which will run on Chrome, Firefox and Safari.

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

### And Coding Style Tests

We use ESLint [recommended set](http://eslint.org/docs/rules/) with some additions for enforcing [Flow] types and other rules.

See [ESLint config](.eslintrc.json) for full configuration.

We also use [.editorconfig](.editorconfig) to maintain consistent coding styles and settings, please make sure you comply with the styling.


## Compatibility

|  | IE | Edge| Firefox| Chrome| Safari | Safari IOS| Firefox/Chrome IOS| Chrome for android|
|--|--| --|--|--|--|--|--|--|--|--|
| Clear Content Download | +* | +* |+*|+|+*|+*|+*|+||
| Protected Content Download | - | - |+*|+|+*|-|-|+||
|Background fetch download (under development)|-|-|-|-|-|-|-|-|-|-|+|

 (+) tested
 (+*) should work, not tested on this platform

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/kaltura/playkit-js/tags).

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE.md](LICENSE.md) file for details
