import '../../src/index.js'
import {Error} from 'playkit-js'
import * as TestUtils from 'playkit-js/test/src/utils/test-utils'
import DBManager from '../../src/db-manager'

describe('dbManager', function () {

  var dbManager;
  let dbConfig = {
    storeName: 'test',
    keyPath: 'entryId'
  };
  let storageObjects = {
    entry1: {
      id: 'entry1',
      expiration: 20000000,
      sources: {}
    },
    entry2: {
      id: 'entry2',
      expiration: 30000000,
      sources: {}
    }

  };
  before(function () {
    dbManager = new DBManager(dbConfig);
    dbManager.open();
  });

  afterEach(function () {
    dbManager.removeAll(dbConfig.storeName);
  });

  after(function () {
  });

  it('should add an item to the indexedDb', (done) => {
    dbManager.add(dbConfig.storeName, 'entry1', storageObjects.entry1).then(() => {
      dbManager.get(dbConfig.storeName, 'entry1').then(data => {
        data.id.should.equal('entry1');
        done();
      })
    });
  });

  it('should get undefined from the indexedDb', (done) => {
    dbManager.add(dbConfig.storeName, 'entry1', storageObjects.entry1).then(() => {
      dbManager.get(dbConfig.storeName, 'entry2').then(data=>{
        expect(data).to.be.undefined;
        done();
      });
    });
  });

  it('should get 2 items from the db, using getAll()', (done) => {
    let add1 = dbManager.add(dbConfig.storeName, 'entry1', storageObjects.entry1);
    let add2 = dbManager.add(dbConfig.storeName, 'entry2', storageObjects.entry2);
    Promise.all([add1,add2]).then(()=>{
      dbManager.getAll(dbConfig.storeName).then(data=>{
        data.length.should.equal(2);
        done();
      })
    });
  });

  it('should not be one item when getting the whole db, using getAll()', (done) => {
    let add1 = dbManager.add(dbConfig.storeName, 'entry1', storageObjects.entry1);
    let add2 = dbManager.add(dbConfig.storeName, 'entry2', storageObjects.entry2);
    Promise.all([add1,add2]).then(()=>{
      dbManager.getAll(dbConfig.storeName).then(data=>{
        data.length.should.not.equal(1);
        done();
      })
    });
  });

  it('should update entry1', (done) => {
    let add1 = dbManager.add(dbConfig.storeName, 'entry1', storageObjects.entry1);
    let add2 = dbManager.add(dbConfig.storeName, 'entry2', storageObjects.entry2);
    Promise.all([add1,add2]).then(()=>{
      return dbManager.get(dbConfig.storeName,'entry1');
    }).then(data=>{
      data.expiration.should.equal(20000000);
      storageObjects.entry1.expiration = 99999999;
      return dbManager.update(dbConfig.storeName, 'entry1' ,storageObjects.entry1);
    }).then(()=>{
      return dbManager.get(dbConfig.storeName, 'entry1');
    }).then(data=>{
      data.expiration.should.equal(99999999);
      done();
    });
  });

  it('should remove entry1', (done) => {
    let add1 = dbManager.add(dbConfig.storeName, 'entry1', storageObjects.entry1);
    let add2 = dbManager.add(dbConfig.storeName, 'entry2', storageObjects.entry2);
    Promise.all([add1,add2]).then(()=>{
      return dbManager.get(dbConfig.storeName,'entry1');
    }).then(data=>{
      expect(data).to.be.Object;
      return dbManager.remove(dbConfig.storeName, 'entry1');
    }).then(()=>{
      return dbManager.get(dbConfig.storeName, 'entry1');
    }).then(data=>{
      expect(data).to.be.undefined;
      done();
    });
  });


});
