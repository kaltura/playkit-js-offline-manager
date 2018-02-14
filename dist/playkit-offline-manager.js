(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("shaka-player"), require("playkit-js-providers"), require("playkit-js"));
	else if(typeof define === 'function' && define.amd)
		define(["shaka-player", "playkit-js-providers", "playkit-js"], factory);
	else if(typeof exports === 'object')
		exports["OfflineManager"] = factory(require("shaka-player"), require("playkit-js-providers"), require("playkit-js"));
	else
		root["playkit"] = root["playkit"] || {}, root["playkit"]["OfflineManager"] = factory(root["shaka"], root["playkit"]["providers"], root["playkit"]["core"]);
})(typeof self !== 'undefined' ? self : this, function(__WEBPACK_EXTERNAL_MODULE_3__, __WEBPACK_EXTERNAL_MODULE_4__, __WEBPACK_EXTERNAL_MODULE_5__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NAME = exports.VERSION = exports.OfflineManager = undefined;

var _offlineManager = __webpack_require__(1);

var _offlineManager2 = _interopRequireDefault(_offlineManager);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.OfflineManager = _offlineManager2.default;
exports.VERSION = "1.0.0";
exports.NAME = "playkit-js-offline-manager";

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _shakaOfflineWrapper = __webpack_require__(2);

var _shakaOfflineWrapper2 = _interopRequireDefault(_shakaOfflineWrapper);

var _playkitJsProviders = __webpack_require__(4);

var _playkitJs = __webpack_require__(5);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Your class description.
 * @classdesc
 */
var OfflineManager = function () {
  _createClass(OfflineManager, null, [{
    key: 'isValid',


    /**
     * TODO: Define under what conditions the plugin is valid.
     * @static
     * @public
     * @returns {boolean} - Whether the plugin is valid.
     */
    value: function isValid() {
      return true;
    }

    /**
     * @constructor
     * @param {string} name - The plugin name.
     * @param {Player} player - The player instance.
     * @param {Object} config - The plugin config.
     */

    /**
     * TODO: Override and define your default configuration for the plugin.
     * The default configuration of the plugin.
     * @type {Object}
     * @static
     */

  }]);

  function OfflineManager(config) {
    _classCallCheck(this, OfflineManager);

    //super(player,config);
    //this.player = player;
    this.config = config;
    this._setOfflineAdapter();
    /**
     Now you have access to the BasePlugin members:
     1. config: The runtime configuration of the plugin.
     2. name: The name of the plugin.
     3. logger: The logger of the plugin.
     4. player: Reference to the actual player.
     5. eventManager: The event manager of the plugin.
    */
  }

  _createClass(OfflineManager, [{
    key: '_setOfflineAdapter',
    value: function _setOfflineAdapter() {
      // if (this.config.manager === 'shaka'){
      this._offlineManager = new _shakaOfflineWrapper2.default(this.player);
      // }
    }
  }, {
    key: 'getMediaInfo',
    value: function getMediaInfo(mediaInfo) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var provider = new _playkitJsProviders.Provider(_this.config.provider);
        provider.getMediaConfig(mediaInfo).then(function (mediaConfig) {
          if (_playkitJs.Utils.Object.hasPropertyPath(mediaConfig, 'sources.dash') && mediaConfig.sources.dash.length > 0) {
            resolve({
              entryData: mediaConfig.sources.dash[0]
            });
            localStorage.setItem("video", JSON.stringify(mediaConfig));
          } else {
            reject("getMediaInfo error");
          }
        });
      });
    }
  }, {
    key: 'download',
    value: function download(url, options) {
      return this._offlineManager.download(url, options);
    }
  }, {
    key: 'deleteMedia',
    value: function deleteMedia(id) {
      this._offlineManager.deleteMedia(id).then(function (res) {});
    }

    /**
     * TODO: Define the destroy logic of your plugin.
     * Destroys the plugin.
     * @override
     * @public
     * @returns {void}
     */

  }, {
    key: 'destroy',
    value: function destroy() {}
    // Write logic


    /**
     * TODO: Define the reset logic of your plugin.
     * Resets the plugin.
     * @override
     * @public
     * @returns {void}
     */

  }, {
    key: 'reset',
    value: function reset() {
      // Write logic
    }
  }]);

  return OfflineManager;
}();

OfflineManager.defaultConfig = {};
exports.default = OfflineManager;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); //flow


var _shakaPlayer = __webpack_require__(3);

var _shakaPlayer2 = _interopRequireDefault(_shakaPlayer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ShakaOfflineWrapper = function () {
  function ShakaOfflineWrapper(player) {
    _classCallCheck(this, ShakaOfflineWrapper);

    this._dtgVideoElement = document.createElement('video');
    _shakaPlayer2.default.polyfill.installAll();
    this._dtgShaka = new _shakaPlayer2.default.Player(this._dtgVideoElement);
  }

  _createClass(ShakaOfflineWrapper, [{
    key: 'download',
    value: function download(uri, options) {
      var storage = this._initStorage();
      var metadata = { 'title': options.title,
        'downloadDate': new Date()
      };
      return storage.store(uri, metadata);
    }
  }, {
    key: 'deleteMedia',
    value: function deleteMedia() {}
  }, {
    key: '_initStorage',
    value: function _initStorage() {
      var storage = new _shakaPlayer2.default.offline.Storage(this._dtgShaka);
      var callback = this._setDownloadProgress;
      storage.configure({
        progressCallback: callback
      });
      return storage;
    }
  }, {
    key: '_setDownloadProgress',
    value: function _setDownloadProgress(content, progress) {
      window.postMessage({ content: content, progress: progress * 100 }, '*');
    }
  }]);

  return ShakaOfflineWrapper;
}();

exports.default = ShakaOfflineWrapper;

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_3__;

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_4__;

/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_5__;

/***/ })
/******/ ]);
});
//# sourceMappingURL=playkit-offline-manager.js.map