require('dotenv').config();
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const expressApp = require('../routing/index');
describe('Express server', function () {
  it('responds to /', async function () {
    const res = await chai.request(expressApp).get('/');
    chai.expect(res).not.to.throw;
    chai.expect(res).to.have.status(200);
  });

  it('responds to a valid /latitude/longitude', async function () {
    const res = await chai.request(expressApp).get('/41.044278/-71.950577');
    chai.expect(res).not.to.throw;
    chai.expect(res).to.have.status(200);
  }).timeout(6000);

  it('responds to an invalid /latitude/longitude', async function () {
    const res = await chai.request(expressApp).get('/lat/lon');
    chai.expect(res).not.to.throw;
    chai.expect(res).to.have.status(400);
  });
});

const { getDistance } = require('../geo/index');
describe('Calculating distances', function () {
  it('geolib is functioning', function () {
    const validCoords = [51.135683, -4.242456];

    const calculatedDistance = getDistance(validCoords, validCoords);

    chai.expect(calculatedDistance).to.be.equal(0);
  });
});
