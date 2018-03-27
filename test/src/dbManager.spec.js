import '../../src/index.js'
import {loadPlayer} from 'playkit-js'
import * as TestUtils from 'playkit-js/test/src/utils/test-utils'
import DBManager from '../../src/db-manager'

const targetId = 'player-placeholder_offline-manager.spec';

describe('dbManager', function () {

  var dbManager;
  before(function () {
    dbManager = new DBManager({});
    dbManager.open();
  });

  afterEach(function () {
  });

  after(function () {
  });

  it('should add item to the indexedDb', (done) => {
    dbManager.add("")
    done();
  });
});
