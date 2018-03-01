//flow
import shaka from 'shaka-player'
import DBManager from './db-manager';
import {FakeEventTarget,FakeEvent} from 'playkit-js'
import getLogger from './utils/logger'

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

export const PROGRESS_EVENT = 'progress';

export class ShakaOfflineWrapper extends FakeEventTarget{

  static _logger: any = getLogger('ShakaOfflineWrapper');

  constructor(downloads) {
    super();
    ShakaOfflineWrapper._logger.debug('ShakaOfflineWrapper created');
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
    this._currentlyDownloaded = [];
  }

  download(entryId: String, options): Promise<*> {
    ShakaOfflineWrapper._logger.debug('download', entryId);
    let currentDownload = this._downloads[entryId];
    if (currentDownload.state){
      return Promise.reject("already downloading / resuming / paused");
    }
    this._configureDrmIfNeeded(entryId);
    this._currentlyDownloaded.push(entryId);
    this._doesEntryExists(entryId).then((existsInDB)=> {
        if (existsInDB) {
          return Promise.reject("already downloading / paused");
        }
        currentDownload['storage'] = this._initStorage(entryId,options);
        currentDownload['state'] = downloadStates.DOWNLOADING;
        return currentDownload.storage.store(currentDownload.sources.dash[0].url, {}).then(offlineManifest => {
          ShakaOfflineWrapper._logger.debug('after storage.store', entryId);
          currentDownload.state = offlineManifest.downloadStatus === downloadStates.PAUSED ? downloadStates.PAUSED : downloadStates.ENDED;
          currentDownload.sources.dash[0].url = offlineManifest.offlineUri;
          return this._dbManager.add(ENTRIES_MAP_STORE_NAME, entryId, this._prepareItemForStorage(currentDownload)).then(() => {
            ShakaOfflineWrapper._logger.debug('after dbManager.add', entryId);
            Promise.resolve({
              action: actions.DOWNLOAD_START,
              entryId: entryId
            });
          });
        })
    }).catch((e) => {
      Promise.reject(e);
    });
  }


  pause(entryId: string): Promise<*> {
    ShakaOfflineWrapper._logger.debug('pause', entryId);
    let currentDownload = this._downloads[entryId];
    if (!currentDownload) {
      return Promise.resolve("not downloading / resuming"); //TODO LOG THIS (until background fetch is here)
    } else {
      if ([downloadStates.DOWNLOADING, downloadStates.RESUMED].includes(currentDownload.state)) {
        return currentDownload.storage.pause().then(() => {
          ShakaOfflineWrapper._logger.debug('after storage.pause', entryId);
          currentDownload.state = downloadStates.PAUSED;
          return this._dbManager.update(ENTRIES_MAP_STORE_NAME, entryId, this._prepareItemForStorage(currentDownload)).then(() => {
            ShakaOfflineWrapper._logger.debug('after dbManager.update', entryId);
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
    ShakaOfflineWrapper._logger.debug('resume', entryId);
    return this._setSessionData(entryId).then(() => {
      let currentDownload = this._downloads[entryId];
      if (currentDownload.state === downloadStates.PAUSED) {
        currentDownload.state = downloadStates.RESUMED;
        currentDownload.storage.resume(currentDownload.sources.dash[0].url).then((manifestDB) => {
          ShakaOfflineWrapper._logger.debug('after storage.resume', entryId);
          currentDownload.state = [manifestDB.downloadStatus,manifestDB.ob].includes(downloadStates.ENDED) ? downloadStates.ENDED : downloadStates.PAUSED;
          this._dbManager.update(ENTRIES_MAP_STORE_NAME, entryId, this._prepareItemForStorage(currentDownload)).then(() => {
            ShakaOfflineWrapper._logger.debug('after dbManager.update', entryId);
            return Promise.resolve({
              action: actions.RESUME,
              entryId: entryId
            });
          })
        });
      } else {
        Promise.reject("already resumed / downloaded");
      }
    }).catch((e) => {
      Promise.reject(e);
    });
  }


  remove(entryId): Promise<*> {
    ShakaOfflineWrapper._logger.debug('remove', entryId);
    return this._setSessionData(entryId).then(() => {
      let currentDownload = this._downloads[entryId];
      if (!currentDownload.state) return Promise.reject("Entry not found");
      currentDownload.storage.remove(currentDownload.sources.dash[0].url).then(() => {
        ShakaOfflineWrapper._logger.debug('after storage.remove', entryId);
        this._dbManager.remove(ENTRIES_MAP_STORE_NAME, entryId).then(() => {
          ShakaOfflineWrapper._logger.debug('after dbManager.remove', entryId);
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

  _doesEntryExists(entryId): Promise<*> {
    return this.getDataByEntry(entryId).then((entry) => {
      return Promise.resolve(entry && entry.state);
    })
  }

  _configureDrmIfNeeded(entryId) {
    ShakaOfflineWrapper._logger.debug('_configureDrmIfNeeded', entryId);
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
    ShakaOfflineWrapper._logger.debug('_setSessionData', entryId);
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


  _initStorage(entryId, options = {}) {
    ShakaOfflineWrapper._logger.debug('_initStorage', entryId);
    let storage = new shaka.offline.Storage(this._dtgShaka);
    let configuration = {
      usePersistentLicense: true,
      progressCallback: this._setDownloadProgress(entryId),
    };
    if (options && options.trackSelectionCallback){
      configuration["trackSelectionCallback"] = options.trackSelectionCallback;
    }
    storage.configure(configuration);
    return storage;
  }

  _setDownloadProgress(entryId) {
    ShakaOfflineWrapper._logger.debug('_setDownloadProgress', entryId);
    return (content, progress) => {
      let event = new FakeEvent(PROGRESS_EVENT, {
        detail: {
          content: content,
          progress: progress * 100,
          entryId: entryId
        }
      });
      this.dispatchEvent(event);
    }
  }

}
