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

const PROGRESS_EVENT = 'progress';

export default class ShakaOfflineWrapper {
  constructor(downloads, player) {
    this._dtgVideoElement = document.createElement('video');
    shaka.polyfill.installAll();

    this._dtgShaka = new shaka.Player(this._dtgVideoElement);
    if (shaka.log) {
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
    this._configureDrmIfNeeded(entryId);
    currentDownload['storage'] = this._initStorage(entryId);
    currentDownload['state'] = downloadStates.DOWNLOADING;
    return currentDownload.storage.store(currentDownload.sources.dash[0].url, metadata).then(offlineManifest => {
      currentDownload['offlineUri'] = offlineManifest.offlineUri;
      return this._dbManager.add(ENTRIES_MAP_STORE_NAME, entryId, this._prepareItemForStorage(currentDownload)).then(() => {
        Promise.resolve({
          action: actions.DOWNLOAD_START,
          entryId: entryId
        });
      });
    }).catch((e) => {

    });
    ;
  }


  pause(entryId): promise<*> {
    let currentDownload = this._downloads[entryId];
    if (!currentDownload) {
      return Promise.resolve("not downloading / resuming"); //TODO LOG THIS (until background fetch is here)
    } else {
      if ([downloadStates.DOWNLOADING, downloadStates.RESUMED].includes(currentDownload.state)) {
        return currentDownload.storage.pause().then(() => {
          currentDownload.state = downloadStates.PAUSED;
          return this._dbManager.update(ENTRIES_MAP_STORE_NAME, entryId, this._prepareItemForStorage(currentDownload)).then(() => {
            Promise.resolve({
              entryId: entryId,
              action: actions.PAUSE
            });
          });
        }).catch((e) => {

        });
        ;
      } else {
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
          this._dbManager.update(ENTRIES_MAP_STORE_NAME, entryId, this._prepareItemForStorage(currrentDownload)).then(() => {
            return Promise.resolve({
              action: actions.RESUME,
              entryId: entryId
            });
          })
        });
      }
    }).catch((e) => {

    });
  }


  deleteMedia(entryId): promise<*> {
    return this._setSessionData(entryId).then(() => {
      let currrentDownload = this._downloads[entryId];
      currrentDownload.state = downloadStates.DELETED;
      currrentDownload.storage.remove(currrentDownload.offlineUri).then(() => {
        this._dbManager.remove(ENTRIES_MAP_STORE_NAME, entryId).then(() => {
          delete this._downloads[entryId];
          return Promise.resolve({
            action: actions.DELETED,
            entryId: entryId
          });
        })
      });

    }).catch((e) => {

    });
  }


  _configureDrmIfNeeded(entryId) {
    let currentDownload = this._downloads[entryId];
    const drmData = currentDownload.sources.dash[0].drmData;
    if (drmData) {
      let servers = {};
      drmData.forEach((val) => {
        servers[val.scheme] = val.licenseUrl;
      });
      this._dtgShaka.configure({'drm': {'servers': servers}})
    } else {
      this._dtgShaka.configure({});
    }
  }


  _prepareItemForStorage(object) {
    const keysToDelete = ["storage", "url", "mimetype"];
    let storeObj = Object.assign({}, object);
    for (let key in storeObj) {
      if (keysToDelete.includes(key)) {
        delete storeObj[key];
      }
    }
    return storeObj;
  }


  _setSessionData(entryId): promise<*> {
    if (this._downloads[entryId]) {
      return Promise.resolve();
    }
    return this._getDownloadedMetadataByEntryId(entryId).then(dbData => {
      let data = Object.assign({}, dbData);
      data['storage'] = this._initStorage(entryId);
      this._downloads[entryId] = data;
      return Promise.resolve();
    });
  }

  _getDownloadedMetadataByEntryId(entryId): promise<*> {
    return this._dbManager.get(ENTRIES_MAP_STORE_NAME, entryId);
  }


  _initStorage(entryId) {
    let storage = new shaka.offline.Storage(this._dtgShaka);

    storage.configure({
      usePersistentLicense: false,
      progressCallback: this._setDownloadProgress(entryId)
    });
    return storage;
  }

  _setDownloadProgress(entryId) {
    return function (content, progress) {
      let event = new CustomEvent(PROGRESS_EVENT, {
        detail: {
          content: content,
          progress: progress * 100,
          entryId: entryId
        }
      });
      window.dispatchEvent(event);
    }
  }

}
