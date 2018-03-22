import chai from 'chai';
import sinonChai from 'sinon-chai';
import sinon from 'sinon/pkg/sinon';
import providers from 'playkit-js-providers'
import playkit from 'playkit-js'

/**
 * @returns {void}
 */
export function prepareTestEnvironment() {
  chai.should();
  chai.use(sinonChai);
  global.chai = chai;
  global.expect = chai.expect;
  global.should = chai.should;
  global.sinon = sinon;
  global._playkitJs = playkit;
  debugger;

}

export default prepareTestEnvironment;
