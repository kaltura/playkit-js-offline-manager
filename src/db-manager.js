// @flow
import idb from 'idb'
import getLogger from './utils/logger'
import {Error} from 'playkit-js'

const KEY_PATH: string = 'entryId';
const ENTRIES_MAP_STORE_NAME: string = 'entriesMap';
const DB_NAME: string = 'offline-manager';

/**
 * Your class description.
 * @classdesc
 */
export default class DBManager {

  static _logger: any = getLogger('DBManager');

  _config: Object = {};

  _dbPromise: ?Promise<*> = null;

  /**
   * @constructor
   * @param {Object} config - The plugin config.
   */
  constructor(config: Object) {
    DBManager._logger.debug('DBManager created');
    if (!('indexedDB' in window)) {
      // console.log('This browser doesn\'t support IndexedDB');
      return;
    }
    this._config = config;
    this.open(DB_NAME);
  }

  open(store: string) {
    this._dbPromise = idb.open(store, 1, (upgradeDb) => {
      DBManager._logger.debug('open');
      if (!upgradeDb.objectStoreNames.contains(ENTRIES_MAP_STORE_NAME)) {
        upgradeDb.createObjectStore(ENTRIES_MAP_STORE_NAME, {keyPath: KEY_PATH});
      }
    });
  }

  add(storeName: string, key: string, item: Object): Promise<*> {
    if (!this._dbPromise) {
      return Promise.reject(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.INDEXED_DB_ERROR));
    }
    return this._dbPromise.then(db => {
      DBManager._logger.debug('add');
      let tx = db.transaction(storeName, 'readwrite');
      let store = tx.objectStore(storeName);
      this._addConfigToItem(item);
      item[KEY_PATH] = key;
      store.put(item);
      return tx.complete;
    }).catch((error) => {
      return Promise.reject(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.CANNOT_ADD_ITEM, error));
    });
  }

  remove(storeName: string, key: string): Promise<*> {
    if (!this._dbPromise) {
      return Promise.reject(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.INDEXED_DB_ERROR));
    }
    return this._dbPromise.then(db => {
      DBManager._logger.debug('remove');
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      return tx.complete;
    }).catch(error => {
      return Promise.reject(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.INDEXED_DB_ERROR, error));
    });
  }

  get(storeName: string, entryId: string): Promise<*> {
    if (!this._dbPromise) {
      return Promise.reject(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.INDEXED_DB_ERROR));
    }
    return this._dbPromise.then(db => {
      DBManager._logger.debug('get', entryId);
      return db.transaction(storeName)
        .objectStore(storeName).get(entryId);
    }).then(obj => {
      return obj;
    }).catch(error => {
      return Promise.reject(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.INDEXED_DB_ERROR, error));
    });
  }

  getAll(storeName: string): Promise<*> {
    if (!this._dbPromise) {
      return Promise.reject(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.INDEXED_DB_ERROR));
    }
    return this._dbPromise.then(db => {
      DBManager._logger.debug('getAll');
      return db.transaction(storeName)
        .objectStore(storeName).getAll();
    }).then(allObjs => {
      return allObjs;
    }).catch(error => {
      return Promise.reject(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.INDEXED_DB_ERROR, error));
    });
  }

  update(store: string, key: string, value: Object): Promise<*> {
    DBManager._logger.debug('update');
    return this.add(store, key, value);
  }

  _addConfigToItem(item: Object): void {
    for (let key in this._config) {
      item[key] = this._config[key];
    }
  }

}


