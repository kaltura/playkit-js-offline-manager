// @flow
import idb from 'idb'
import getLogger from "./utils/logger";
import {Error} from 'playkit-js'

const KEY_PATH: string = 'entryId';
const ENTRIES_MAP_STORE_NAME: string = 'entriesMap';
const DB_NAME: string = 'offline-manager';

/**
 * Your class description.
 * @classdesc
 */
export default class DBManager{

  static _logger: any = getLogger('DBManager');
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
    this.config = config;
    this.open(DB_NAME);
  }

  open(store){
    this.dbPromise = idb.open(store, 1, (upgradeDb)=>{
      DBManager._logger.debug('open');
      if (!upgradeDb.objectStoreNames.contains(ENTRIES_MAP_STORE_NAME)) {
        upgradeDb.createObjectStore(ENTRIES_MAP_STORE_NAME, {keyPath: KEY_PATH});
      }
    });
  }

  add(storeName, key ,item){
    return this.dbPromise.then(db => {
      DBManager._logger.debug('add');
      let tx = db.transaction(storeName, 'readwrite');
      let store = tx.objectStore(storeName);
      this._addConfigToItem(item);
      item[KEY_PATH] = key;
      store.put(item);
      return tx.complete;
    }).catch((error)=> {
      return Promise.reject(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.CANNOT_ADD_ITEM, error));
    });
  }

  remove(storeName,key){
    return this.dbPromise.then(db => {
      DBManager._logger.debug('remove');
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      return tx.complete;
    }).catch(error => {
      return Promise.reject(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.REQUESTED_ITEM_NOT_FOUND, error));
    });
  }

  get(storeName, entryId){
    return this.dbPromise.then(db => {
      DBManager._logger.debug('get', entryId);
      return db.transaction(storeName)
        .objectStore(storeName).get(entryId);
    }).then(obj =>{
      return obj;
    }).catch(error => {
      return Promise.reject(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.REQUESTED_ITEM_NOT_FOUND, error));
    });
  }

  getAll(storeName){
    return this.dbPromise.then(db => {
      DBManager._logger.debug('getAll');
      return db.transaction(storeName)
        .objectStore(storeName).getAll();
    }).then(allObjs => {
      return allObjs;
    }).catch(error => {
      return Promise.reject(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.REQUESTED_ITEM_NOT_FOUND, error));
    });
  }

  removeAll(store){
    return store; //TODO implement
  }

  update(store,key,value){
    DBManager._logger.debug('update');
    return this.add(store,key,value);
  }

  _addConfigToItem(item){
    for (let key in this.config){
      item[key] = this.config[key];
    }
  }

}


