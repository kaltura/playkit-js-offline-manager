// @flow
import {ShakaOfflineWrapper,PROGRESS_EVENT} from "./shaka-offline-wrapper";
import {Provider} from 'playkit-js-providers';
import {Utils,FakeEventTarget,EventManager} from 'playkit-js';
import getLogger, {getLogLevel, setLogLevel, LogLevel} from './utils/logger'
/**
 * Your class description.
 * @classdesc
 */
export default class OfflineManager extends FakeEventTarget{

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
    if (this._downloads){
      return;
    }
    // this.config = config;
    this._downloads = {};
    this._config = config;
    this._eventManager = new EventManager();
    this._setOfflineAdapter();
  }

  _setOfflineAdapter(): void{
      this._offlineManager = new ShakaOfflineWrapper(this._downloads, this._config);
      this._eventManager.listen(this._offlineManager,PROGRESS_EVENT,(e)=>{
        this.dispatchEvent(e)});
  }

  getMediaInfo(mediaInfo: Object): Promise<*>{
    OfflineManager._logger.debug('getMediaInfo', mediaInfo.entryId);
    return new Promise((resolve, reject)=>{
      if (this._downloads[mediaInfo.entryId]){
        return resolve(this._downloads[mediaInfo.entryId].sources.dash[0]);
      }
      const provider = new Provider(this._config.provider);
      return provider.getMediaConfig(mediaInfo)
        .then(mediaConfig => {
          OfflineManager._logger.debug('after provider.getMediaConfig');
          if( Utils.Object.hasPropertyPath(mediaConfig, 'sources.dash') && mediaConfig.sources.dash.length > 0){
            let sourceData = mediaConfig.sources.dash[0];
            sourceData.entryId = mediaInfo.entryId;
            this._downloads[mediaInfo.entryId] = mediaConfig;
            return resolve(sourceData);
          }else{
            OfflineManager._logger.debug('getMediaInfo error');
            return reject("getMediaInfo error");
          }
        });
    })
  }

  pause(entryId): Promise<*>{
    OfflineManager._logger.debug('pause',entryId );
    return this._offlineManager.pause(entryId);
  }

  resume(entryId): Promise<*>{
    OfflineManager._logger.debug('resume', entryId);
    return this._offlineManager.resume(entryId);
  }

  download(url: string, options: Object): Promise<*>{
    OfflineManager._logger.debug('download', url);
    return this._offlineManager.download(url, options);
  }

  remove(entryId: string): Promise<*>{
    OfflineManager._logger.debug('remove', entryId);
    return this._offlineManager.remove(entryId);
  }

  getMediaInfoFromDB(entryId: string): Promise<*>{
    OfflineManager._logger.debug('getMediaInfoFromDB', entryId);
    return this._offlineManager.getDataByEntry(entryId);
  }

  getAllDownloads(): Promise<*>{
    return this._offlineManager.getAllDownloads();
  }

  removeAll(): Promise<*>{
    let promises = [];
    return this.getAllDownloads().then(downloads => {
      downloads.forEach(download => {
        promises.push(this.remove(download.entryId));
      });
      this._downloads = {};
      return Promise.all(promises);
    });
  }

  pauseAll(): Promise<*>{
    let promises = [];
    return this.getAllDownloads().then(downloads => {
      downloads.forEach(download => {
        promises.push(this.pause(download.entryId));
      });
      return Promise.all(promises);
    });
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


