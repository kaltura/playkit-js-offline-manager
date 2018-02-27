// @flow
import ShakaOfflineWrapper from './shaka-offline-wrapper'
import {Provider} from 'playkit-js-providers'
import {Utils} from 'playkit-js'
import {dbManager} from 'db-manager'



/**
 * Your class description.
 * @classdesc
 */
export default class OfflineManager{

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
   * @param {string} name - The plugin name.
   * @param {Player} player - The player instance.
   * @param {Object} config - The plugin config.
   */
  constructor(config) {
    if (this._downloads){
      return;
    }
    // this.config = config;
    this._downloads = {};
    this._config = config;
    this._setOfflineAdapter();

    /**
     Now you have access to the BasePlugin members:
     1. config: The runtime configuration of the plugin.
     2. name: The name of the plugin.
     3. logger: The logger of the plugin.
     4. player: Reference to the actual player.
     5. eventManager: The event manager of the plugin.
    */
  }


  _setOfflineAdapter(): void{
    // if (this.config.manager === 'shaka'){
      this._offlineManager = new ShakaOfflineWrapper(this._downloads);
    // }
  }

  getMediaInfo(mediaInfo: Object): Promise<*>{
    return new Promise((resolve, reject)=>{
      const provider = new Provider(this._config.provider);
      provider.getMediaConfig(mediaInfo)
        .then(mediaConfig => {
          if( Utils.Object.hasPropertyPath(mediaConfig, 'sources.dash') && mediaConfig.sources.dash.length > 0){
            let sourceData = mediaConfig.sources.dash[0];
            sourceData.entryId = mediaInfo.entryId;
            this._downloads[mediaInfo.entryId] = mediaConfig;
            resolve(sourceData);
          }else{
            reject("getMediaInfo error");
          }
        });
    })
  }

  pause(entryId): Promise<*>{
    return this._offlineManager.pause(entryId);
  }

  resume(entryId): Promise<*>{
    return this._offlineManager.resume(entryId);
  }

  download(url: string, options: Object): Promise<*>{
    return this._offlineManager.download(url, options);
  }

  deleteMedia(entryId: string): Promise<*>{
    return this._offlineManager.deleteMedia(entryId);
  }

  getMediaInfoFromDB(entryId: string): Promise<*>{
    return this._offlineManager.getDataByEntry(entryId);
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


