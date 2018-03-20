import downloadStates from "../utils/download-states"


export default class ShakaItem{
  constructor(data){
    this.state = data.state || null
    this.source = data.sources.dash[0];
    this.expiration = data.expiratoin || null;
    this.storageItem = data;
  }

  allowDownload(){

  }

  allowResume(){

  }

  allowPause(){

  }

  prepareItemForStorage(){

  }

  loadItem(){

  }

  configureDrmData(entryId) {

  }

  set storage(storage: Object): void {

  }

  get storage(): Object {
    return this.storage;
  }


  set state(state: string): void{
    this.state = state;
  }

  get state(): string{
    return this.state;
  }

  addDownloadParam(param?: string): void{

  }

  get source(){
    return this.source;
  }

  set source(source: string){
    this.source = source;
  }

}
