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

const NOT_SUPPORTED_SOURCE_TYPES = ['hls', 'progressive'];

const SUPPORTED_SOURCE = 'dash';
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
    OfflineManager._logger.debug('get media info started', mediaInfo.id);
    return new Promise((resolve) => {
      if (this._downloads[mediaInfo.id]) {
        return resolve(this._downloads[mediaInfo.id].sources.dash[0]);
      }
      const provider = new Provider(this._config.provider);
      return provider.getMediaConfig(mediaInfo)
        .then(mediaConfig => {
          if (Utils.Object.hasPropertyPath(mediaConfig, 'sources.dash') && mediaConfig.sources.dash.length > 0) {
            mediaConfig = this._removeNotRelevantSources(mediaConfig);
            let sourceData = mediaConfig.sources.dash[0];
            sourceData.id = mediaConfig.sources.id;
            this._downloads[mediaConfig.sources.id] = mediaConfig;
            OfflineManager._logger.debug('get media info ended');
            return resolve(sourceData);
          } else {
            this._onError(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.COULD_NOT_GET_INFO_FROM_MEDIA_PROVIDER));
          }
        });
    })
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
            this._onError(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.PAUSE_FAILED, error));
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
        return this._offlineProvider.resume(entryId).then((manifestDB) => {
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
      this._onError(error);
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
      this._onError(error);
    });
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
          .then(this._dbManager.update(ENTRIES_MAP_STORE_NAME, entryId, this._offlineProvider.prepareItemForStorage(currentDownload)))
          .then(() => {
            OfflineManager._logger.debug('download ended / paused', entryId);
            resolve({
              state: currentDownload.state,
              entryId: entryId
            });
          }).catch(error => this._onError(error));
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
        }).catch(error => this._onError(error));
      }).catch(error => this._onError(error));
    }).catch(error => this._onError(error));
  }


  removeAll(): Promise<*> {
    let promises = [];
    return this.getAllDownloads().then(downloads => {
      downloads.forEach(download => {
        promises.push(this.remove(download.sources.id));
      });
      this._downloads = {};
      return Promise.all(promises);
    });
  }

  pauseAll(): Promise<*> {
    let promises = [];
    return this.getAllDownloads().then(downloads => {
      downloads.forEach(download => {
        promises.push(this.pause(download.sources.id));
      });
      return Promise.all(promises);
    });
  }

  getExpiration(entryId): Promise<*> {
    return this.getDownloadedMediaConfig(entryId).then(data => {
      return data.expiration;
    });
  }

  /**
   * Getting the full media config of an entry from the indexed db. It contains the full provider info
   * the status of the download, actual size of the entry, expected size (full size) and drm expiration date.
   * @param entryId
   * @returns {*}
   */
  getDownloadedMediaConfig(entryId: string): Promise<*> {
    OfflineManager._logger.debug('getDownloadedMediaConfig', entryId);
    return this._dbManager.get(ENTRIES_MAP_STORE_NAME, entryId);
  }

  /**
   * Getting all the in progress, ended, resumed, paused and ended downloads.
   * @returns {Promise<Array<Object>>}
   */
  getAllDownloads(): Promise<*> {
    if (this._isDBSynced) {
      return Promise.resolve(this._getReducedDownloadObjectsData());
    }
    return this._dbManager.getAll(ENTRIES_MAP_STORE_NAME).then(dbDownloads => {
      this._isDBSynced = true;
      dbDownloads.forEach((download) => {
        const entryId = download.sources.id;
        if (!this._downloads[entryId]) {
          this._downloads[entryId] = download;
          this._recoverEntry(entryId);
        }
      });
      return Promise.resolve(this._getReducedDownloadObjectsData());
    });
  }

  /**
   * add parameter to the manifest url so the server will know it's only for downloading and not playing (stats purpose)
   * @param entryId
   * @private
   */
  _addDownloadParam(entryId: string): void {
    let currentDownload = this._downloads[entryId];
    currentDownload.sources.dash[0].url = currentDownload.sources.dash[0].url + DOWNLOAD_PARAM;
  }

  /**
   * checking if an entry exists already in the DB.
   * @param entryId
   * @returns {Promise<any>}
   * @private
   */
  _doesEntryExists(entryId): Promise<*> {
    return new Promise((resolve) => {
      return this.getDownloadedMediaConfig(entryId).then((entry) => {
        resolve(entry && entry.state);
      })
    })
  }

  /**
   * Removing  sources that we are not downloading from the media config
   * currently as we are having only dash adapter, we will take the first dash source.
   * @param {Object} mediaConfig
   * @private
   */
  _removeNotRelevantSources(mediaConfig: Object): Object {
    for (let key in mediaConfig.sources) {
      let source = mediaConfig.sources[key];
      if (NOT_SUPPORTED_SOURCE_TYPES.includes(key)) {
        delete mediaConfig.sources[key];
      } else if (key === SUPPORTED_SOURCE) {
        source = source.slice(1);
      }
    }
    return Object.assign({}, mediaConfig);
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
      if (currEntry.state === downloadStates.DOWNLOADING || currEntry.state === downloadStates.RESUMED) {
        currEntry.state = downloadStates.PAUSED;
      }
      currEntry.recovered = true;
    }
  }

  /**
   * get a reduced and normalized version of the provider data.
   * @returns {Array<Object>}
   * @private
   */
  _getReducedDownloadObjectsData() {
    return Object.keys(this._downloads).map(i => {
      const item = this._downloads[i];
      return {
        id: item.sources.id,
        metadata: item.sources.metadata,
        poster: item.sources.poster,
        expectedSize: item.expectedSize,
        size: item.size,
        expiration: item.expiration,
        state: item.state
      };
    });
  }

  /**
   * Error handler, dispatches an error object
   * @param error
   * @private
   */
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
