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

  constructor(downloads) {
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

  download(entryId: String, metadata: Object): Promise<*> {
    let currentDownload = this._downloads[entryId];
    this._configureDrmIfNeeded(entryId);
    currentDownload['storage'] = this._initStorage(entryId);
    currentDownload['state'] = downloadStates.DOWNLOADING;
    return currentDownload.storage.store(currentDownload.sources.dash[0].url, metadata).then(offlineManifest => {
      currentDownload.sources.dash[0].url = offlineManifest.offlineUri;
      return this._dbManager.add(ENTRIES_MAP_STORE_NAME, entryId, this._prepareItemForStorage(currentDownload)).then(() => {
        Promise.resolve({
          action: actions.DOWNLOAD_START,
          entryId: entryId
        });
      });
    }).catch((e) => {
      Promise.reject(e);
    });

  }


  pause(entryId: string): Promise<*> {
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
          Promise.reject(e);
        });
      } else {
        return Promise.resolve();
      }
    }
  }

  resume(entryId: string): Promise<*> {
    return this._setSessionData(entryId).then(() => {
      let currentDownload = this._downloads[entryId];
      if (currentDownload.state === downloadStates.PAUSED) {
        currentDownload.state = downloadStates.RESUMED;
        currentDownload.storage.resume(currentDownload.sources.dash[0].url).then(() => {
          this._dbManager.update(ENTRIES_MAP_STORE_NAME, entryId, this._prepareItemForStorage(currentDownload)).then(() => {
            return Promise.resolve({
              action: actions.RESUME,
              entryId: entryId
            });
          })
        });
      }
    }).catch((e) => {
      Promise.reject(e);
    });
  }


  deleteMedia(entryId): Promise<*> {
    return this._setSessionData(entryId).then(() => {
      let currentDownload = this._downloads[entryId];
      currentDownload.state = downloadStates.DELETED;

      currentDownload.storage.remove(currentDownload.sources.dash[0].url).then(() => {
        this._dbManager.remove(ENTRIES_MAP_STORE_NAME, entryId).then(() => {
          delete this._downloads[entryId];
          return Promise.resolve({
            action: actions.DELETED,
            entryId: entryId
          });
        })
      });

    }).catch((e) => {
      Promise.reject(e);
    });
  }

  getDataByEntry(entryId): Promise<*> {
    return this._dbManager.get(ENTRIES_MAP_STORE_NAME, entryId);
  }

  getAllDownloads(): Promise<*> {
    return this._dbManager.getAll(ENTRIES_MAP_STORE_NAME);
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


  _setSessionData(entryId): Promise<*> {
    if (this._downloads[entryId]) {
      return Promise.resolve();
    }
    return this.getDataByEntry(entryId).then(dbData => {
      let data = Object.assign({}, dbData);
      data['storage'] = this._initStorage(entryId);
      this._downloads[entryId] = data;
      return Promise.resolve();
    });
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
