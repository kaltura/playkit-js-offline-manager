//flow
import shaka from 'shaka-player'
import DBManager from './db-manager';
import {FakeEventTarget, FakeEvent, Error, EventType as EVENTS} from 'playkit-js'
import getLogger from './utils/logger'

const downloadStates = {
  DOWNLOADING: 'downloading',
  PAUSED: 'paused',
  RESUMED: 'resumed',
  ENDED: 'ended'
};

const ENTRIES_MAP_STORE_NAME = 'entriesMap';

export const PROGRESS_EVENT = 'progress';

export class ShakaOfflineProvider extends FakeEventTarget {

  static _logger: any = getLogger('ShakaOfflineProvider');

  constructor(downloads) {
    super();
    ShakaOfflineProvider._logger.debug('ShakaOfflineProvider created');
    this._dtgVideoElement = document.createElement('video');
    shaka.polyfill.installAll();
    this._dtgShaka = new shaka.Player(this._dtgVideoElement);
    this._configureShakaPlayer();
    this._dtgShaka.addEventListener(EVENTS.ERROR, this._onShakaError);
    // todo remove this as part of the classes refactor, adding the offline provider config should be on "item.prepareforstorage()"
    this._dbManager = new DBManager({
      adapterName: 'shaka',
      adapterVersion: "",//player.version,
      playerVersion: ""//player.version
    });
    this._downloads = downloads;
  }

  _configureShakaPlayer(): void {
    this._dtgShaka.configure({
      streaming: {
        retryParameters: {
          timeout: 0,       // timeout in ms, after which we abort a request; 0 means never
          maxAttempts: 100,   // the maximum number of requests before we fail
          baseDelay: 1000,  // the base delay in ms between retries
          backoffFactor: 2, // the multiplicative backoff factor between retries
          fuzzFactor: 0.5  // the fuzz factor to apply to each retry delay
        }
      }
    });
  }

  download(entryId: String, options): Promise<*> {
    return new Promise((resolve, reject) => {
      ShakaOfflineProvider._logger.debug('download', entryId);
      let currentDownload = this._downloads[entryId];
      this._configureDrmIfNeeded(entryId);
      currentDownload['storage'] = this._initStorage(entryId, options);
      // first store manifest
      currentDownload.storage.storeManifest(currentDownload.sources.dash[0].url, {}).then(manifest=>{
        ShakaOfflineProvider._logger.debug('after storage.storeManifest', entryId);
        currentDownload.state = downloadStates.DOWNLOADING;
        currentDownload.recovered = true;
        currentDownload.sources.dash[0].url = manifest.offlineUri;
        currentDownload.expiration = manifest.expiration;
        currentDownload.expectedSize = manifest.expectedSize;
        currentDownload.size = manifest.size;
        return this._dbManager.add(ENTRIES_MAP_STORE_NAME, entryId, this.prepareItemForStorage(currentDownload));
      }).then(() => {
        // then download the content
        return currentDownload.storage.download(currentDownload.sources.dash[0].url)
      }).then((manifest) => {
        currentDownload.size = manifest.size;
        currentDownload.state = manifest.downloadStatus;
        resolve();
      }).catch((error) => {
        reject(new Error(Error.Severity.RECOVERABLE, Error.Category.STORAGE, Error.Code.DOWNLOAD_ABORTED, error));
      });
    })
  }

  pause(entryId: string): Promise<*> {
    ShakaOfflineProvider._logger.debug('pause', entryId);
    const currentDownload = this._downloads[entryId];
    return currentDownload.storage.pause();
  }

  resume(entryId: string): Promise<*> {
    ShakaOfflineProvider._logger.debug('resume', entryId);
    const currentDownload = this._downloads[entryId];
    return currentDownload.storage.download(currentDownload.sources.dash[0].url);
  }

  remove(entryId): Promise<*> {
    ShakaOfflineProvider._logger.debug('remove', entryId);
    const currentDownload = this._downloads[entryId];
    // in case of removing a download in progress, we have to pause the download and wait for the
    // store promise to be resolved. Only then we will have the shaka offline storage uri, so it can be deleted
    // from the shaka indexed db as well.
    let pausePromise = currentDownload.state === downloadStates.ENDED ? Promise.resolve() : this.pause(entryId);
    let storePormise = currentDownload.storePromise || Promise.resolve();
    return Promise.all([pausePromise, storePormise]).then(() => {
      currentDownload.storage = this._initStorage(entryId, {action: 'remove'});
      return currentDownload.storage.remove(currentDownload.sources.dash[0].url);
    });
  }

  renewLicense(entryId): Promise<*> {
    ShakaOfflineProvider._logger.debug('renewLicense', entryId);
    const currentDownload = this._downloads[entryId];
    this._configureDrmIfNeeded(entryId);
    currentDownload['storage'] = this._initStorage(entryId, {});
    return currentDownload.storage.renewLicense(currentDownload.sources.dash[0].url).then(manifestDB => {
      currentDownload.expiration = manifestDB.expiration;
      return Promise.resolve(manifestDB.expiration);
    });
  }

  getDataByEntry(entryId): Promise<*> {
    return this._dbManager.get(ENTRIES_MAP_STORE_NAME, entryId);
  }

  getAllDownloads(): Promise<*> {
    return this._dbManager.getAll(ENTRIES_MAP_STORE_NAME);
  }

  _onShakaError(event: any): void {
    if (event && event.detail) {
      const error = event.detail;
      //currently we don't handle video element errors on the offline shaka
      if (error.code === this.VIDEO_ERROR_CODE) {
        ShakaOfflineProvider._logger.error(error);
        return;
      }

      const playerError = new Error(
        error.severity,
        error.category,
        error.code,
        error.data);
      ShakaOfflineProvider._logger.error(playerError);
      this.dispatchEvent(new FakeEvent(EVENTS.ERROR, {
        detail: playerError
      }));
    }
  }

  _configureDrmIfNeeded(entryId) {
    ShakaOfflineProvider._logger.debug('configure drm if needed', entryId);
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

  prepareItemForStorage(object) {
    const keysToDelete = ["storage", "url", "mimetype", "storePromise"];
    let storeObj = Object.assign({}, object);
    for (let key in storeObj) {
      if (keysToDelete.includes(key)) {
        delete storeObj[key];
      }
    }
    let selectedSource = object.sources.dash[0];
    selectedSource['localSource'] = true;
    object.sources.dash = [selectedSource]; // storing only one relevant source
    return storeObj;
  }


  /**
   * This function makes an entry ready to be used by the download manager.
   * It gets the entry data from DB, it refreshes the drm data and create a shaka storage
   * object if one was not created already.
   * @param entryId
   * @param newMediaInfo - new mediaInfo from the server (used for renewDRM) TODO: pass only drm data?
   * @returns {Promise<any>}
   */
  setSessionData(entryId, newMediaInfo): Promise<*> {
    ShakaOfflineProvider._logger.debug('set session data', entryId);
    return new Promise((resolve, reject) => {
      if (this._downloads[entryId]) {
        return resolve();
      }
      return this.getDataByEntry(entryId).then(dbData => {
        let data = Object.assign({}, dbData);
        this._downloads[entryId] = data;
        return resolve();
      }).catch(error => {
        reject(error);
      });
    }).then(() => {
      let currentDownload = this._downloads[entryId];
      currentDownload.storage = currentDownload.storage ? currentDownload.storage : this._initStorage(entryId);
      this._updateDrmDataIfNeeded(entryId, newMediaInfo);
      return Promise.resolve();
    }).catch(error => {
      Promise.reject(error);
    });
  }

  _updateDrmDataIfNeeded(entryId, newMediaInfo) {
    if (!newMediaInfo) {
      return;
    }
    let currentDownload_ = this._downloads[entryId];
    if (currentDownload_.sources.dash[0].drmData && newMediaInfo.sources.dash[0].drmData) {
      currentDownload_.sources.dash[0].drmData = newMediaInfo.sources.dash[0].drmData;
    }
  }

  _trackSelectionCallback(bitrate = 0, language = null) {
    return function (tracks) {
      const textTracks = tracks.filter(track => {
        return track.type === 'text'
      });
      const langFilteredTracks = tracks.filter(track => {
        return track.language === language && track.type !== 'text'
      });
      tracks = langFilteredTracks.length > 0 ? langFilteredTracks : tracks;
      let closest = tracks.reduce(function (prev, curr) {
        return (Math.abs(curr.bandwidth - bitrate) < Math.abs(prev.bandwidth - bitrate) ? curr : prev);
      });
      return [closest].concat(textTracks);
    }
  }

  _initStorage(entryId, options = {}) {
    ShakaOfflineProvider._logger.debug('init storage', entryId);
    let storage = new shaka.offline.Storage(this._dtgShaka);
    let configuration = {
      usePersistentLicense: true
    };
    if (options.bitrate || options.language){
      configuration["trackSelectionCallback"] = this._trackSelectionCallback(options.bitrate, options.language);
    }
    if (!options.action || options.action !== 'remove'){
      configuration["progressCallback"] = this._setDownloadProgress(entryId);
    }
    storage.configure(configuration);
    return storage;
  }

  _setDownloadProgress(entryId) {
    ShakaOfflineProvider._logger.debug('set download progress', entryId);
    return (content, progress) => {
      let event = new FakeEvent(PROGRESS_EVENT, {
        detail: {
          content: content,
          progress: progress * 100,
          entryId: entryId
        },
        details: {
          content: content,
          progress: progress * 100,
          entryId: entryId
        }
      });
      this.dispatchEvent(event);
    }
  }

}
