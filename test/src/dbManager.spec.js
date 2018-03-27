import '../../src/index.js'
import {loadPlayer} from 'playkit-js'
import * as TestUtils from 'playkit-js/test/src/utils/test-utils'
import DBManager from '../../src/db-manager'

const targetId = 'player-placeholder_offline-manager.spec';

describe('OfflineManager', function () {
  const config = {
    sources: {
      dash: [
        {
          mimetype: "video/mp4",
          url: "http://www.html5videoplayer.net/videos/toystory.mp4"
        }
      ]
    }
  };
  var dbManager;
  before(function () {
    dbManager = new DBManager({});
  });

  afterEach(function () {
  });

  after(function () {
  });

  it('should play mp4 stream with offline-manager plugin', (done) => {
    done();
  });
});
