// @flow
import {Utils} from 'playkit-js'
import idb from 'idb'

const KEY_PATH: string = 'entryId';
const ENTRIES_MAP_STORE_NAME: string = 'entriesMap';
const DB_NAME: string = 'offline-manager'
/**
 * Your class description.
 * @classdesc
 */
export default class DBManager{


  /**
   * @constructor
   * @param {string} name - The plugin name.
   * @param {Player} player - The player instance.
   * @param {Object} config - The plugin config.
   */
  constructor(config: Object) {
    if (!('indexedDB' in window)) {
      console.log('This browser doesn\'t support IndexedDB');
      return;
    }
    this.config = config;
    this.open(DB_NAME);
  }

  open(store){
    this.dbPromise = idb.open(store, 1, (upgradeDb)=>{
      if (!upgradeDb.objectStoreNames.contains(ENTRIES_MAP_STORE_NAME)) {
        upgradeDb.createObjectStore(ENTRIES_MAP_STORE_NAME, {keyPath: KEY_PATH});
      }
    });
  }

  add(storeName, key ,item){
    return this.dbPromise.then(db => {
      let tx = db.transaction(storeName, 'readwrite');
      let store = tx.objectStore(storeName);
      this._addConfigToItem(item);
      item[KEY_PATH] = key;
      store.put(item);
      return tx.complete;
    }).then(()=> {
      console.log('added item ' + key);
    });
  }

  remove(storeName,key){
    return dbPromise.then(db => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      return tx.complete;
    });
  }

  get(storeName, entryId){
    return dbPromise.then(db => {
      return db.transaction(storeName)
        .objectStore(storeName).get(entryId);
    }).then(obj =>{
      return obj;
    });
  }

  getAll(storeName){
    return dbPromise.then(db => {
      return db.transaction(storeName)
        .objectStore(storeName).getAll();
    }).then(allObjs => {
      return allObj;
    });
  }

  removeAll(store){

  }

  update(store,key,value){
    return this.add(store,key,value);
  }

  _addConfigToItem(item){
    for (let key in this.config){
      item[key] = config.key;
    }
  }

}


