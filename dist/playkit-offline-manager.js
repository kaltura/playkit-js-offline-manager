(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["OfflineManager"] = factory();
	else
		root["playkit"] = root["playkit"] || {}, root["playkit"]["OfflineManager"] = factory();
})(typeof self !== 'undefined' ? self : this, function() {
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
/***/ (function(module, exports) {

throw new Error("Module build failed: Error: ENOENT: no such file or directory, open '/Users/oded.hutzler/repositories/playkit-js-offline-manager/.babelrc'\n    at Object.fs.openSync (fs.js:652:18)\n    at Object.fs.readFileSync (fs.js:553:33)\n    at ConfigChainBuilder.addConfig (/Users/oded.hutzler/repositories/playkit-js-offline-manager/node_modules/babel-core/lib/transformation/file/options/build-config-chain.js:146:32)\n    at ConfigChainBuilder.findConfigs (/Users/oded.hutzler/repositories/playkit-js-offline-manager/node_modules/babel-core/lib/transformation/file/options/build-config-chain.js:96:16)\n    at buildConfigChain (/Users/oded.hutzler/repositories/playkit-js-offline-manager/node_modules/babel-core/lib/transformation/file/options/build-config-chain.js:61:13)\n    at OptionManager.init (/Users/oded.hutzler/repositories/playkit-js-offline-manager/node_modules/babel-core/lib/transformation/file/options/option-manager.js:354:58)\n    at File.initOptions (/Users/oded.hutzler/repositories/playkit-js-offline-manager/node_modules/babel-core/lib/transformation/file/index.js:212:65)\n    at new File (/Users/oded.hutzler/repositories/playkit-js-offline-manager/node_modules/babel-core/lib/transformation/file/index.js:135:24)\n    at Pipeline.transform (/Users/oded.hutzler/repositories/playkit-js-offline-manager/node_modules/babel-core/lib/transformation/pipeline.js:46:16)\n    at transpile (/Users/oded.hutzler/repositories/playkit-js-offline-manager/node_modules/babel-loader/lib/index.js:46:20)\n    at Object.module.exports (/Users/oded.hutzler/repositories/playkit-js-offline-manager/node_modules/babel-loader/lib/index.js:163:20)");

/***/ })
/******/ ]);
});
//# sourceMappingURL=playkit-offline-manager.js.map