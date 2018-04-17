// @flow
import {ShakaOfflineProvider, PROGRESS_EVENT} from "./shaka-offline-provider";
import {Provider} from 'playkit-js-providers';
import {Utils, FakeEventTarget, EventManager, Error, EventType as EVENTS, FakeEvent} from 'playkit-js';
import getLogger, {setLogLevel, LogLevel} from './utils/logger'
import DBManager from "./db-manager";


const downloadStates = {
  DOWNLOADING: 'downloading',
  PAUSED: 'paused',
  RESUMED: 'resumed',
  ENDED: 'ended',
  ERROR: 'error'
};

const ENTRIES_MAP_STORE_NAME = 'entriesMap';

const DOWNLOAD_PARAM = '?playbackType=offline';

const SOURCE_TYPE = 'dash';
/**
 * Your class description.
 * @classdesc
 */
export default class OfflineManager extends FakeEventTarget {

  static _logger: any = getLogger('OfflineManager');

  /**
   * TODO: Define under what conditions the plugin is valid.
   * @static
   * @public
   * @returns {boolean} - Whether the plugin is valid.
   */
  static isValid(): boolean {
    return true;
  }

  /**
   * @constructor
   * @param {Object} config - The plugin config.
   */
  constructor(config) {
    if (config.logLevel && LogLevel[config.logLevel]) {
      setLogLevel(LogLevel[config.logLevel]);
    }
    OfflineManager._logger.debug('offline manager created');
    super();
    if (this._downloads) {
      return;
    }
    this._downloads = {};
    this._config = config;
    this._eventManager = new EventManager();
    this._dbManager = new DBManager({});
    this._setOfflineAdapter();
    this._isDBSynced = false;
  }

  _setOfflineAdapter(): void {
    this._offlineProvider = new ShakaOfflineProvider(this._downloads, this._config);
    this._eventManager.listen(this._offlineProvider, PROGRESS_EVENT, (e) => {
      this.dispatchEvent(e);
    });
  }

  /**
   * This function gets the configuration (and info) from the provider.
   * @param mediaInfo
   * @returns {Promise<any>}
   */
  getMediaConfig(mediaInfo: Object): Promise<*> {
    OfflineManager._logger.debug('get media info started', mediaInfo.entryId);
    return new Promise((resolve) => {
      if (this._downloads[mediaInfo.entryId]) {
        return resolve(this._downloads[mediaInfo.entryId].sources.dash[0]);
      }
      const provider = new Provider(this._config.provider);
      return provider.getMediaConfig(mediaInfo)
        .then(mediaConfig => {
          if (Utils.Object.hasPropertyPath(mediaConfig, 'sources.dash') && mediaConfig.sources.dash.length > 0) {
            mediaConfig = this._removeNotRelevantSources(mediaConfig, SOURCE_TYPE);
            let sourceData = mediaConfig.sources.dash[0];
            sourceData.entryId = mediaInfo.entryId;
            this._downloads[mediaInfo.entryId] = mediaConfig;
            OfflineManager._logger.debug('get media info ended');
            return resolve(sourceData);
          } else {
            this._onError(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.COULD_NOT_GET_INFO_FROM_MEDIA_PROVIDER));
          }
        });
    })
  }

  /**
   * Removing  sources that we are not downloading from the media config
   * currently as we are having only dash adapter, we will take the first dash source.
   * @param {Object} mediaConfig
   * @private
   */
  _removeNotRelevantSources(mediaConfig: Object, relevantSourceType: string): Object {
    for (let key in mediaConfig.sources) {
      let source = mediaConfig.sources[key];
      if (key === relevantSourceType) {
        source = source.slice(1);
      } else {
        delete mediaConfig.sources[key];
      }
    }
    return Object.assign({}, mediaConfig);
  }


  /**
   * This function pauses a download
   * @param entryId
   * @returns {Promise<any>}
   */
  pause(entryId): Promise<*> {
    return new Promise((resolve) => {
      OfflineManager._logger.debug('pause start', entryId);
      let currentDownload = this._downloads[entryId];
      if (!currentDownload) {
        this._onError(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.ENTRY_DOES_NOT_EXIST, entryId)); //TODO LOG THIS (until background fetch is here)
      } else {
        this._recoverEntry(entryId);
        if ([downloadStates.DOWNLOADING, downloadStates.RESUMED].includes(currentDownload.state)) {
          return this._offlineProvider.pause(entryId).then(() => {
            currentDownload.state = downloadStates.PAUSED;
            return this._dbManager.update(ENTRIES_MAP_STORE_NAME, entryId, this._offlineProvider.prepareItemForStorage(currentDownload)).then(() => {
              OfflineManager._logger.debug('paused ended', entryId);
              resolve({
                entryId: entryId,
                state: downloadStates.PAUSE
              });
            });
          }).catch((error) => {
            this._onError(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.PAUSE_ABORTERD, error));
          });
        } else {
          return resolve();
        }
      }
    });
  }

  /**
   * This function resumes a download
   * @param entryId
   * @returns {Promise<*>}
   */
  resume(entryId): Promise<*> {
    OfflineManager._logger.debug('resume started', entryId);
    return this._offlineProvider.setSessionData(entryId).then(() => {
      let currentDownload = this._downloads[entryId];
      this._recoverEntry(entryId);
      if (currentDownload.state === downloadStates.PAUSED) {
        currentDownload.state = downloadStates.RESUMED;
        this._offlineProvider.resume(entryId).then((manifestDB) => {
          currentDownload.state = [manifestDB.downloadStatus, manifestDB.ob].includes(downloadStates.ENDED) ? downloadStates.ENDED : downloadStates.PAUSED;
          this._dbManager.update(ENTRIES_MAP_STORE_NAME, entryId, this._offlineProvider.prepareItemForStorage(currentDownload)).then(() => {
            OfflineManager._logger.debug('resume ended / paused', entryId);
            return Promise.resolve({
              state: currentDownload.state,
              entryId: entryId
            });
          })
        });
      }
    }).catch((error) => {
      this._onError(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.RESUME_REJECTED, error));
    });
  }

  /**
   * This function gets an entryId and renew it's DRM license from the server
   * @param entryId
   * @returns {Promise<T>}
   */
  renewLicense(entryId): Promise<*> {
    OfflineManager._logger.debug('renew license started', entryId);
    const provider = new Provider(this._config.provider);
    return provider.getMediaConfig({
      entryId: entryId
    }).then(mediaConfig => {
      if (!Utils.Object.hasPropertyPath(mediaConfig, 'sources.dash') && mediaConfig.sources.dash.length > 0) {
        this._onError(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.RENEW_LICENSE_FAILED, 'not enough data from the media provider'));
      }
      return this._offlineProvider.setSessionData(entryId, mediaConfig).then(() => {
        let currentDownload = this._downloads[entryId];
        if (currentDownload.state === downloadStates.ENDED) {
          this._offlineProvider.renewLicense(entryId).then((expiration) => {
            this._dbManager.update(ENTRIES_MAP_STORE_NAME, entryId, this._offlineProvider.prepareItemForStorage(currentDownload)).then(() => {
              OfflineManager._logger.debug('renew license ended', entryId);
              return Promise.resolve({
                state: currentDownload.state,
                entryId: entryId,
                expiration: expiration
              });
            })
          });
        }
      })
    }).catch((error) => {
      this._onError(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.RENEW_LICENSE_FAILED, error));
    });
  }

  _addDownloadParam(entryId): void {
    let currentDownload = this._downloads[entryId];
    currentDownload.sources.dash[0].url = currentDownload.sources.dash[0].url + DOWNLOAD_PARAM;
  }

  download(entryId: string, options: Object): Promise<*> {
    return new Promise((resolve) => {
      OfflineManager._logger.debug('download start', entryId);
      let currentDownload = this._downloads[entryId];
      if (currentDownload.state) {
        this._onError(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.ENTRY_ALREADY_EXISTS, entryId));
        return;
      }
      this._doesEntryExists(entryId).then(existsInDB => {
        if (existsInDB) {
          this._onError(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.ENTRY_ALREADY_EXISTS, entryId));
          return;
        }
        currentDownload['state'] = downloadStates.DOWNLOADING;
        this._addDownloadParam(entryId);
        this._offlineProvider.download(entryId, options)
          .then(() => {
            return this._dbManager.update(ENTRIES_MAP_STORE_NAME, entryId, this._offlineProvider.prepareItemForStorage(currentDownload));
          })
          .then(() => {
            OfflineManager._logger.debug('download ended / paused', entryId);
            resolve({
              state: currentDownload.state,
              entryId: entryId
            });
          }).catch((error) => {
          this._onError(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.DOWNLOAD_ABORTED, error));
        });
      });
    });
  }

  remove(entryId: string): Promise<*> {
    OfflineManager._logger.debug('remove start', entryId);
    return this._offlineProvider.setSessionData(entryId).then(() => {
      let currentDownload = this._downloads[entryId];
      if (!currentDownload.state) {
        this._onError(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.REQUESTED_ITEM_NOT_FOUND));
      }
      this._offlineProvider.remove(entryId).then(() => {
        this._dbManager.remove(ENTRIES_MAP_STORE_NAME, entryId).then(() => {
          delete this._downloads[entryId];
          OfflineManager._logger.debug('remove ended', entryId);
          return Promise.resolve({
            state: currentDownload.state,
            entryId: entryId
          });
        })
      });
    }).catch((error) => {
      this._onError(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.REMOVE_REJECTED, error));
    });
  }

  _doesEntryExists(entryId): Promise<*> {
    return new Promise((resolve) => {
      return this.getDownloadedMediaConfig(entryId).then((entry) => {
        resolve(entry && entry.state);
      })
    })
  }

  /**
   * The indexed db can contain corrupted values regarding a download if something goes wrong.
   * for example, it can has a "downloading" state while there is nothing downloaded,
   * if a download was interrupted unexpectedly (browser crash e.g).
   * this function handles this.
   * @private
   */
  _recoverEntry(entryId) {
    let currEntry = this._downloads[entryId];
    if (!currEntry || currEntry.recovered) {
      return;
    } else {
      if (currEntry.state === downloadStates.DOWNLOADING || currEntry.state === downloadStates.RESUMED){
        currEntry.state=downloadStates.PAUSED;
      }
      currEntry.recovered = true;
    }
  }

  getDownloadedMediaConfig(entryId: string): Promise<*> {
    OfflineManager._logger.debug('getDownloadedMediaConfig', entryId);
    return this._dbManager.get(ENTRIES_MAP_STORE_NAME, entryId);
  }

  getAllDownloads(): Promise<*> {
    if (this._isDBSynced) {
      return Promise.resolve(Object.values(this._downloads));
    }
    return this._dbManager.getAll(ENTRIES_MAP_STORE_NAME).then(dbDownloads => {
      this._isDBSynced = true;
      dbDownloads.forEach((download) => {
        if (!this._downloads[download.id]) {
          this._downloads[download.id] = download;
        }
      });
      return Promise.resolve(Object.values(this._downloads));
    });
  }


  removeAll(): Promise<*> {
    let promises = [];
    return this.getAllDownloads().then(downloads => {
      downloads.forEach(download => {
        promises.push(this.remove(download.entryId));
      });
      this._downloads = {};
      return Promise.all(promises);
    });
  }

  pauseAll(): Promise<*> {
    let promises = [];
    return this.getAllDownloads().then(downloads => {
      downloads.forEach(download => {
        promises.push(this.pause(download.entryId));
      });
      return Promise.all(promises);
    });
  }

  getExpiration(entryId): Promise<*> {
    return this.getDownloadedMediaConfig(entryId).then(data => {
      return data.expiration;
    });
  }

  _onError(error: Error): void {
    let event = new FakeEvent(EVENTS.ERROR, error);
    this.dispatchEvent(event);
  }

  /**
   * TODO: Define the destroy logic of your plugin.
   * Destroys the plugin.
   * @override
   * @public
   * @returns {void}
   */
  destroy(): void {
    // Write logic
    this._eventManager.destroy();
  }

  /**
   * TODO: Define the reset logic of your plugin.
   * Resets the plugin.
   * @override
   * @public
   * @returns {void}
   */
  reset(): void {
    // Write logic
  }
}
