import shakaItem from 'shaka-item'


export default class ItemFactory{
  constructor(type, data){
    switch (type){
      case 'shaka':
        return new shakaItem(data);
    }
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

  get state(): string{
    return this.state;
  }

  set state(state: string): void{
    this.state = state;
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
