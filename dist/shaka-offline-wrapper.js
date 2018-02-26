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

    return currentDownload.storage.store(currentDownload.url, metadata).then(offlineManifest => {
      const item = {
        offlineUri: offlineManifest.offlineUri,
        entryId: entryId,
        state: downloadStates.DOWNLOADING
      };
      this._dbManager.add(ENTRIES_MAP_STORE_NAME, entryId, item).then(()=>{
        Promise.resolve({
          action: actions.DOWNLOAD_END,
          entryId: entryId
        });
      });
    });
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

  pause(entryId): promise<*> {
    if (!this._downloads.entryId) {
      Promise.resolve("not downloading / resuming"); //TODO LOG THIS (until background fetch is here)
    }else{
      if ([downloadStates.DOWNLOADING, downloadStates.RESUMED].includes(dbData.status)) {
        this._downloads.entryId.storage.pause().then(()=>{
          const item = {
            entryId: entryId,
            state: downloadStates.PAUSED
          };
          this._dbManager.update(ENTRIES_MAP_STORE_NAME, entryId, item).then(()=>{
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

  resume(entryId): promise<*> {

    this._getDownloadedMetadataByEntryId(entryId).then(dbData => {
      if (dbData.status === downloadStates.PAUSED) {
        this._setSessionData();
        let storage = this._downloads.entryId.storage;
        storage.resume(preferences.offlineUri).then(() => {
          Promise.resolve({
            action: action.RESUME,
            entryId: entryId
          });
        });
      }
    });
  }



  _setSessionData(entryId): promise<*> {
    if (this._downloads.entryId) {
      return this._downloads.entryId;
    }
    const data = {
      storage: this._initStorage(),
      status: null
    }
    this._downloads[entryId] = data;
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
