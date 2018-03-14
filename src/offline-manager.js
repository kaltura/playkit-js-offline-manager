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
  }

  _setOfflineAdapter(): void {
    this._offlineProvider = new ShakaOfflineProvider(this._downloads, this._config);
    this._eventManager.listen(this._offlineProvider, PROGRESS_EVENT, (e) => {
      this.dispatchEvent(e);
    });
  }

  getMediaInfo(mediaInfo: Object): Promise<*> {
    OfflineManager._logger.debug('get media info started', mediaInfo.entryId);
    return new Promise((resolve) => {
      if (this._downloads[mediaInfo.entryId]) {
        return resolve(this._downloads[mediaInfo.entryId].sources.dash[0]);
      }
      const provider = new Provider(this._config.provider);
      return provider.getMediaConfig(mediaInfo)
        .then(mediaConfig => {
          if (Utils.Object.hasPropertyPath(mediaConfig, 'sources.dash') && mediaConfig.sources.dash.length > 0) {
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


  pause(entryId): Promise<*> {
    return new Promise((resolve) => {
      OfflineManager._logger.debug('pause start', entryId);
      let currentDownload = this._downloads[entryId];
      if (!currentDownload) {
        this._onError(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.ENTRY_DOES_NOT_EXIST, entryId)); //TODO LOG THIS (until background fetch is here)
      } else {
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

  resume(entryId): Promise<*> {
    OfflineManager._logger.debug('resume started', entryId);
    return this._offlineProvider.setSessionData(entryId).then(() => {
      let currentDownload = this._downloads[entryId];
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
            return this._dbManager.add(ENTRIES_MAP_STORE_NAME, entryId, this._offlineProvider.prepareItemForStorage(currentDownload));
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
      return this.getDownloadedMediaInfo(entryId).then((entry) => {
        resolve(entry && entry.state);
      })
    })
  }

  getDownloadedMediaInfo(entryId: string): Promise<*> {
    OfflineManager._logger.debug('getDownloadedMediaInfo', entryId);
    return this._offlineProvider.getDataByEntry(entryId);
  }

  getAllDownloads(): Promise<*> {
    return this._offlineProvider.getAllDownloads();
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
    return this.getDownloadedMediaInfo(entryId).then(data => {
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
