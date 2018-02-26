(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("playkit-js"), require("shaka-player"), require("playkit-js-providers"));
	else if(typeof define === 'function' && define.amd)
		define(["playkit-js", "shaka-player", "playkit-js-providers"], factory);
	else if(typeof exports === 'object')
		exports["OfflineManager"] = factory(require("playkit-js"), require("shaka-player"), require("playkit-js-providers"));
	else
		root["playkit"] = root["playkit"] || {}, root["playkit"]["OfflineManager"] = factory(root["playkit"]["core"], root["shaka"], root["playkit"]["providers"]);
})(typeof self !== 'undefined' ? self : this, function(__WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_5__, __WEBPACK_EXTERNAL_MODULE_7__) {
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
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _playkitJs = __webpack_require__(1);

var _idb = __webpack_require__(6);

var _idb2 = _interopRequireDefault(_idb);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var KEY_PATH = 'entryId';
var ENTRIES_MAP_STORE_NAME = 'entriesMap';
var DB_NAME = 'offline-manager';
/**
 * Your class description.
 * @classdesc
 */

var DBManager = function () {

  /**
   * @constructor
   * @param {string} name - The plugin name.
   * @param {Player} player - The player instance.
   * @param {Object} config - The plugin config.
   */
  function DBManager(config) {
    _classCallCheck(this, DBManager);

    if (!('indexedDB' in window)) {
      console.log('This browser doesn\'t support IndexedDB');
      return;
    }
    this.config = config;
    this.open(DB_NAME);
  }

  _createClass(DBManager, [{
    key: 'open',
    value: function open(store) {
      this.dbPromise = _idb2.default.open(store, 1, function (upgradeDb) {
        if (!upgradeDb.objectStoreNames.contains(ENTRIES_MAP_STORE_NAME)) {
          upgradeDb.createObjectStore(ENTRIES_MAP_STORE_NAME, { keyPath: KEY_PATH });
        }
      });
    }
  }, {
    key: 'add',
    value: function add(storeName, key, item) {
      var _this = this;

      return this.dbPromise.then(function (db) {
        var tx = db.transaction(storeName, 'readwrite');
        var store = tx.objectStore(storeName);
        _this._addConfigToItem(item);
        item[KEY_PATH] = key;
        store.put(item);
        return tx.complete;
      }).then(function () {
        console.log('added item ' + key);
      });
    }
  }, {
    key: 'remove',
    value: function remove(storeName, key) {
      return dbPromise.then(function (db) {
        var tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).delete(key);
        return tx.complete;
      });
    }
  }, {
    key: 'get',
    value: function get(storeName, entryId) {
      return dbPromise.then(function (db) {
        return db.transaction(storeName).objectStore(storeName).get(entryId);
      }).then(function (obj) {
        return obj;
      });
    }
  }, {
    key: 'getAll',
    value: function getAll(storeName) {
      return dbPromise.then(function (db) {
        return db.transaction(storeName).objectStore(storeName).getAll();
      }).then(function (allObjs) {
        return allObj;
      });
    }
  }, {
    key: 'removeAll',
    value: function removeAll(store) {}
  }, {
    key: 'update',
    value: function update(store, key, value) {
      this.add(store, key, value);
    }
  }, {
    key: '_addConfigToItem',
    value: function _addConfigToItem(item) {
      for (var key in this.config) {
        item[key] = config.key;
      }
    }
  }]);

  return DBManager;
}();

exports.default = DBManager;

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NAME = exports.VERSION = exports.OfflineManager = undefined;

var _offlineManager = __webpack_require__(3);

var _offlineManager2 = _interopRequireDefault(_offlineManager);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.OfflineManager = _offlineManager2.default;
exports.VERSION = "1.0.0";
exports.NAME = "playkit-js-offline-manager";

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _shakaOfflineWrapper = __webpack_require__(4);

var _shakaOfflineWrapper2 = _interopRequireDefault(_shakaOfflineWrapper);

var _playkitJsProviders = __webpack_require__(7);

var _playkitJs = __webpack_require__(1);

var _dbManager = __webpack_require__(0);

var _dbManager2 = __webpack_require__(0);

var _dbManager3 = _interopRequireDefault(_dbManager2);

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

    /**
     * TODO: Override and define your default configuration for the plugin.
     * The default configuration of the plugin.
     * @type {Object}
     * @static
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

  }]);

  function OfflineManager(config) {
    _classCallCheck(this, OfflineManager);

    //super(player,config);
    //this.player = player;
    this.config = config;
    this._downloads = {};
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
      this._offlineManager = new _shakaOfflineWrapper2.default(this._downloads, this.player);
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
            var sourceData = mediaConfig.sources.dash[0];
            sourceData.entryId = mediaInfo.entryId;
            _this._downloads[mediaInfo.entryId] = sourceData;
            resolve(sourceData);
          } else {
            reject("getMediaInfo error");
          }
        });
      });
    }
  }, {
    key: 'pause',
    value: function pause(entryId) {
      return this._offlineManager.pause(entryId);
    }
  }, {
    key: 'resume',
    value: function resume(entryId) {
      return this._offlineManager.resume(entryId);
    }
  }, {
    key: 'download',
    value: function download(url, options) {
      return this._offlineManager.download(url, options);
    }
  }, {
    key: 'deleteMedia',
    value: function deleteMedia(entryId) {
      return this._offlineManager.deleteMedia(entryId);
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
OfflineManager.downloads = {};
exports.default = OfflineManager;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); //flow


var _shakaPlayer = __webpack_require__(5);

var _shakaPlayer2 = _interopRequireDefault(_shakaPlayer);

var _dbManager = __webpack_require__(0);

var _dbManager2 = _interopRequireDefault(_dbManager);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var downloadStates = {
  DOWNLOADING: 'downloading',
  PAUSED: 'paused',
  RESUMED: 'resumed',
  ENDED: 'ended'
};

var actions = {
  PAUSE: 'pause',
  RESUME: 'resume',
  DELETE: 'delete',
  DOWNLOAD_START: 'downloadStart',
  DOWNLOAD_END: 'downloadEnd'
};

var ENTRIES_MAP_STORE_NAME = 'entriesMap';

var ShakaOfflineWrapper = function () {
  function ShakaOfflineWrapper(downloads, player) {
    _classCallCheck(this, ShakaOfflineWrapper);

    this._dtgVideoElement = document.createElement('video');
    _shakaPlayer2.default.polyfill.installAll();

    this._dtgShaka = new _shakaPlayer2.default.Player(this._dtgVideoElement);
    if (_shakaPlayer2.default.log) {
      _shakaPlayer2.default.log.setLevel(_shakaPlayer2.default.log.Level.DEBUG);
    }

    this._dbManager = new _dbManager2.default({
      adapterName: 'shaka',
      adapterVersion: "", //player.version,
      playerVersion: "" //player.version
    });
    this._downloads = downloads;
  }

  _createClass(ShakaOfflineWrapper, [{
    key: 'download',
    value: function download(entryId, metadata) {
      var _this = this;

      var currentDownload = this._downloads[entryId];
      currentDownload['storage'] = this._initStorage();

      return currentDownload.storage.store(currentDownload.url, metadata).then(function (offlineManifest) {
        var item = {
          offlineUri: offlineManifest.offlineUri,
          entryId: entryId,
          state: downloadStates.DOWNLOADING
        };
        _this._dbManager.add(ENTRIES_MAP_STORE_NAME, entryId, item).then(function () {
          Promise.resolve({
            action: actions.DOWNLOAD_END,
            entryId: entryId
          });
        });
      });
    }
  }, {
    key: 'deleteMedia',
    value: function deleteMedia(entryId) {
      var _this2 = this;

      this._getDownloadedMetadataByEntryId(entryId).then(function (dbData) {
        _this2._setSessionData();
        var storage = _this2._downloads.entryId.storage;
        storage.remove(dbData.offlineUri).then(function () {
          Promise.resolve({
            action: action.delete,
            entryId: entryId
          });
        });
      });
    }
  }, {
    key: 'pause',
    value: function pause(entryId) {
      var _this3 = this;

      if (!this._downloads.entryId) {
        Promise.resolve("not downloading / resuming"); //TODO LOG THIS (until background fetch is here)
      } else {
        if ([downloadStates.DOWNLOADING, downloadStates.RESUMED].includes(dbData.status)) {
          this._downloads.entryId.storage.pause().then(function () {
            var item = {
              entryId: entryId,
              state: downloadStates.PAUSED
            };
            _this3._dbManager.update(ENTRIES_MAP_STORE_NAME, entryId, item).then(function () {
              Promise.resolve({
                action: actions.DOWNLOAD_END,
                entryId: entryId
              });
            });
          });

          Promise.resolve({
            entryId: entryId,
            action: actions.PAUSE
          });
        }
      }
    }
  }, {
    key: 'resume',
    value: function resume(entryId) {
      var _this4 = this;

      this._getDownloadedMetadataByEntryId(entryId).then(function (dbData) {
        if (dbData.status === downloadStates.PAUSED) {
          _this4._setSessionData();
          var storage = _this4._downloads.entryId.storage;
          storage.resume(preferences.offlineUri).then(function () {
            Promise.resolve({
              action: action.RESUME,
              entryId: entryId
            });
          });
        }
      });
    }
  }, {
    key: '_setSessionData',
    value: function _setSessionData(entryId) {
      if (this._downloads.entryId) {
        return this._downloads.entryId;
      }
      var data = {
        storage: this._initStorage(),
        status: null
      };
      this._downloads[entryId] = data;
    }
  }, {
    key: '_getDownloadedMetadataByEntryId',
    value: function _getDownloadedMetadataByEntryId(entryId) {
      return this._dbManager.get(ENTRIES_MAP_STORE_NAME, entryId);
    }
  }, {
    key: '_initStorage',
    value: function _initStorage() {
      var storage = new _shakaPlayer2.default.offline.Storage(this._dtgShaka);
      var callback = this._setDownloadProgress;

      storage.configure({
        progressCallback: this._setDownloadProgress
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
/* 5 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_5__;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


(function() {
  function toArray(arr) {
    return Array.prototype.slice.call(arr);
  }

  function promisifyRequest(request) {
    return new Promise(function(resolve, reject) {
      request.onsuccess = function() {
        resolve(request.result);
      };

      request.onerror = function() {
        reject(request.error);
      };
    });
  }

  function promisifyRequestCall(obj, method, args) {
    var request;
    var p = new Promise(function(resolve, reject) {
      request = obj[method].apply(obj, args);
      promisifyRequest(request).then(resolve, reject);
    });

    p.request = request;
    return p;
  }

  function promisifyCursorRequestCall(obj, method, args) {
    var p = promisifyRequestCall(obj, method, args);
    return p.then(function(value) {
      if (!value) return;
      return new Cursor(value, p.request);
    });
  }

  function proxyProperties(ProxyClass, targetProp, properties) {
    properties.forEach(function(prop) {
      Object.defineProperty(ProxyClass.prototype, prop, {
        get: function() {
          return this[targetProp][prop];
        },
        set: function(val) {
          this[targetProp][prop] = val;
        }
      });
    });
  }

  function proxyRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return this[targetProp][prop].apply(this[targetProp], arguments);
      };
    });
  }

  function proxyCursorRequestMethods(ProxyClass, targetProp, Constructor, properties) {
    properties.forEach(function(prop) {
      if (!(prop in Constructor.prototype)) return;
      ProxyClass.prototype[prop] = function() {
        return promisifyCursorRequestCall(this[targetProp], prop, arguments);
      };
    });
  }

  function Index(index) {
    this._index = index;
  }

  proxyProperties(Index, '_index', [
    'name',
    'keyPath',
    'multiEntry',
    'unique'
  ]);

  proxyRequestMethods(Index, '_index', IDBIndex, [
    'get',
    'getKey',
    'getAll',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(Index, '_index', IDBIndex, [
    'openCursor',
    'openKeyCursor'
  ]);

  function Cursor(cursor, request) {
    this._cursor = cursor;
    this._request = request;
  }

  proxyProperties(Cursor, '_cursor', [
    'direction',
    'key',
    'primaryKey',
    'value'
  ]);

  proxyRequestMethods(Cursor, '_cursor', IDBCursor, [
    'update',
    'delete'
  ]);

  // proxy 'next' methods
  ['advance', 'continue', 'continuePrimaryKey'].forEach(function(methodName) {
    if (!(methodName in IDBCursor.prototype)) return;
    Cursor.prototype[methodName] = function() {
      var cursor = this;
      var args = arguments;
      return Promise.resolve().then(function() {
        cursor._cursor[methodName].apply(cursor._cursor, args);
        return promisifyRequest(cursor._request).then(function(value) {
          if (!value) return;
          return new Cursor(value, cursor._request);
        });
      });
    };
  });

  function ObjectStore(store) {
    this._store = store;
  }

  ObjectStore.prototype.createIndex = function() {
    return new Index(this._store.createIndex.apply(this._store, arguments));
  };

  ObjectStore.prototype.index = function() {
    return new Index(this._store.index.apply(this._store, arguments));
  };

  proxyProperties(ObjectStore, '_store', [
    'name',
    'keyPath',
    'indexNames',
    'autoIncrement'
  ]);

  proxyRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'put',
    'add',
    'delete',
    'clear',
    'get',
    'getAll',
    'getKey',
    'getAllKeys',
    'count'
  ]);

  proxyCursorRequestMethods(ObjectStore, '_store', IDBObjectStore, [
    'openCursor',
    'openKeyCursor'
  ]);

  proxyMethods(ObjectStore, '_store', IDBObjectStore, [
    'deleteIndex'
  ]);

  function Transaction(idbTransaction) {
    this._tx = idbTransaction;
    this.complete = new Promise(function(resolve, reject) {
      idbTransaction.oncomplete = function() {
        resolve();
      };
      idbTransaction.onerror = function() {
        reject(idbTransaction.error);
      };
      idbTransaction.onabort = function() {
        reject(idbTransaction.error);
      };
    });
  }

  Transaction.prototype.objectStore = function() {
    return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
  };

  proxyProperties(Transaction, '_tx', [
    'objectStoreNames',
    'mode'
  ]);

  proxyMethods(Transaction, '_tx', IDBTransaction, [
    'abort'
  ]);

  function UpgradeDB(db, oldVersion, transaction) {
    this._db = db;
    this.oldVersion = oldVersion;
    this.transaction = new Transaction(transaction);
  }

  UpgradeDB.prototype.createObjectStore = function() {
    return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments));
  };

  proxyProperties(UpgradeDB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(UpgradeDB, '_db', IDBDatabase, [
    'deleteObjectStore',
    'close'
  ]);

  function DB(db) {
    this._db = db;
  }

  DB.prototype.transaction = function() {
    return new Transaction(this._db.transaction.apply(this._db, arguments));
  };

  proxyProperties(DB, '_db', [
    'name',
    'version',
    'objectStoreNames'
  ]);

  proxyMethods(DB, '_db', IDBDatabase, [
    'close'
  ]);

  // Add cursor iterators
  // TODO: remove this once browsers do the right thing with promises
  ['openCursor', 'openKeyCursor'].forEach(function(funcName) {
    [ObjectStore, Index].forEach(function(Constructor) {
      Constructor.prototype[funcName.replace('open', 'iterate')] = function() {
        var args = toArray(arguments);
        var callback = args[args.length - 1];
        var nativeObject = this._store || this._index;
        var request = nativeObject[funcName].apply(nativeObject, args.slice(0, -1));
        request.onsuccess = function() {
          callback(request.result);
        };
      };
    });
  });

  // polyfill getAll
  [Index, ObjectStore].forEach(function(Constructor) {
    if (Constructor.prototype.getAll) return;
    Constructor.prototype.getAll = function(query, count) {
      var instance = this;
      var items = [];

      return new Promise(function(resolve) {
        instance.iterateCursor(query, function(cursor) {
          if (!cursor) {
            resolve(items);
            return;
          }
          items.push(cursor.value);

          if (count !== undefined && items.length == count) {
            resolve(items);
            return;
          }
          cursor.continue();
        });
      });
    };
  });

  var exp = {
    open: function(name, version, upgradeCallback) {
      var p = promisifyRequestCall(indexedDB, 'open', [name, version]);
      var request = p.request;

      request.onupgradeneeded = function(event) {
        if (upgradeCallback) {
          upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
        }
      };

      return p.then(function(db) {
        return new DB(db);
      });
    },
    delete: function(name) {
      return promisifyRequestCall(indexedDB, 'deleteDatabase', [name]);
    }
  };

  if (true) {
    module.exports = exp;
    module.exports.default = module.exports;
  }
  else {
    self.idb = exp;
  }
}());


/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE_7__;

/***/ })
/******/ ]);
});
//# sourceMappingURL=playkit-offline-manager.js.map