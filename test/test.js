require('dotenv').config();
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const expressApp = require('../routing/index');
describe('Express server', function () {

    it('responds to /', function (done) {
        chai.request(expressApp)
            .get('/')
            .end(function (err, res) {
                chai.expect(err).to.be.null;
                chai.expect(res).to.have.status(200);
                done();
            });
        });

    it('responds to a valid /latitude/longitude', function (done) {
        chai.request(expressApp)
            .get('/41.044278/-71.950577')
            .end(function (err, res) {
                chai.expect(err).to.be.null;
                chai.expect(res).to.have.status(200);
                done();
            });
        });

    it('responds to an invalid /latitude/longitude', function (done) {
        chai.request(expressApp)
            .get('/lat/lon')
            .end(function (err, res) {
            chai.expect(err).to.be.null;
            chai.expect(res).to.have.status(400);
            done();
            });
        });

});

const { getDistance } = require('../geo/index');
describe('Calculating distances', function() {
    it('geolib is functioning', function () {
        const validCoords = [51.135683,-4.242456];

        const calculatedDistance = getDistance(validCoords, validCoords);

        chai.expect(calculatedDistance).to.be.equal(0);
    });

});

