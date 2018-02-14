//flow
import shaka from 'shaka-player'

export default class ShakaOfflineWrapper{

  constructor(player){
    this._dtgVideoElement = document.createElement('video');
    shaka.polyfill.installAll();
    this._dtgShaka = new shaka.Player(this._dtgVideoElement);
  }


  download(uri: string, options: Object): promise<*>{
    let storage = this._initStorage();
    const metadata = {'title': options.title,
      'downloadDate': new Date()
    }
    return storage.store(uri, metadata);
  }

  deleteMedia(): promise<*>{

  }

  _initStorage(){
    let storage = new shaka.offline.Storage(this._dtgShaka);
    let callback = this._setDownloadProgress;
    storage.configure({
      progressCallback: callback
    });
    return storage;
  }

  _setDownloadProgress(content, progress) {
    window.postMessage({content: content, progress: progress*100}, '*');
  }

}
