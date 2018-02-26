//flow
import shaka from 'shaka-player'
import DBManager from "./db-manager";

const downloadStates = {
  DOWNLOADING: 'downloading',
  PAUSED: 'paused',
  RESUMED: 'resumed',
  ENDED: 'ended'
};

const actions = {
  PAUSE: 'pause',
  RESUME: 'resume',
  DELETE: 'delete',
  DOWNLOAD_START: 'downloadStart',
  DOWNLOAD_END: 'downloadEnd'
};

const ENTRIES_MAP_STORE_NAME = 'entriesMap';

export default class ShakaOfflineWrapper {
  constructor(downloads, player) {
    this._dtgVideoElement = document.createElement('video');
    shaka.polyfill.installAll();

    this._dtgShaka = new shaka.Player(this._dtgVideoElement);
    if (shaka.log){
      shaka.log.setLevel(shaka.log.Level.DEBUG);
    }

    this._dbManager = new DBManager({
      adapterName: 'shaka',
      adapterVersion: "",//player.version,
      playerVersion: ""//player.version
    });
    this._downloads = downloads;
  }


  download(entryId: string, metadata: Object): promise<*> {
    let currentDownload = this._downloads[entryId];
    currentDownload['storage'] = this._initStorage();
    currentDownload['state'] = downloadStates.DOWNLOADING;
    return currentDownload.storage.store(currentDownload.url, metadata).then(offlineManifest => {
      currentDownload['offlineUri'] = offlineManifest.offlineUri;
      return this._dbManager.add(ENTRIES_MAP_STORE_NAME, entryId, this._prepareItemForStorage(currentDownload)).then(()=>{
        Promise.resolve({
          action: actions.DOWNLOAD_START,
          entryId: entryId
        });
      });
    });
  }





  pause(entryId): promise<*> {
    let currentDownload = this._downloads[entryId];
    if (!currentDownload) {
      return Promise.resolve("not downloading / resuming"); //TODO LOG THIS (until background fetch is here)
    }else{
      if ([downloadStates.DOWNLOADING, downloadStates.RESUMED].includes(currentDownload.state)) {
        return currentDownload.storage.pause().then(()=>{
          currentDownload.state = downloadStates.PAUSED;
          return this._dbManager.update(ENTRIES_MAP_STORE_NAME, entryId, this._prepareItemForStorage(currentDownload)).then(()=>{
            Promise.resolve({
              entryId: entryId,
              action: actions.PAUSE
            });
          });
        });
      }else{
        return Promise.resolve();
      }
    }
  }

  resume(entryId): promise<*> {
    return this._setSessionData(entryId).then(() => {
      let currrentDownload = this._downloads[entryId];
      if (currrentDownload.state === downloadStates.PAUSED) {
        currrentDownload.state = downloadStates.RESUMED;
        currrentDownload.storage.resume(currrentDownload.offlineUri).then(() => {
          this._dbManager.update(ENTRIES_MAP_STORE_NAME, entryId, this._prepareItemForStorage(currrentDownload)).then(()=>{
            return Promise.resolve({
              action: actions.RESUME,
              entryId: entryId
            });
          })
        });
      }
    });
  }

  _prepareItemForStorage(object){
    const keysToDelete = ["storage", "url", "mimetype"];
    let storeObj = Object.assign({}, object);
    for (let key in storeObj){
      if (keysToDelete.includes(key)){
        delete storeObj[key];
      }
    }
    return storeObj;
  }

  deleteMedia(entryId): promise<*> {
    this._getDownloadedMetadataByEntryId(entryId).then(dbData => {
      this._setSessionData();
      let storage = this._downloads.entryId.storage;
      storage.remove(dbData.offlineUri).then(() => {
        Promise.resolve({
          action: action.delete,
          entryId: entryId
        });
      });
    });
  }



  _setSessionData(entryId): promise<*> {
    if (this._downloads[entryId]) {
      return Promise.resolve();
    }
    return this._getDownloadedMetadataByEntryId(entryId).then(dbData => {
      let data = Object.assign({}, dbData);
      data['storage'] = this._initStorage();
      this._downloads[entryId] = data;
      return Promise.resolve();
    });
  }

  _getDownloadedMetadataByEntryId(entryId): promise<*> {
    return this._dbManager.get(ENTRIES_MAP_STORE_NAME, entryId);
  }


  _initStorage() {
    let storage = new shaka.offline.Storage(this._dtgShaka);
    let callback = this._setDownloadProgress;

    storage.configure({
      progressCallback: this._setDownloadProgress
    });
    return storage;
  }

  _setDownloadProgress(content, progress) {
    window.postMessage({content: content, progress: progress * 100}, '*');
  }

}
