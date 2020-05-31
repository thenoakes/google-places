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

function testPlaceDetailOpeningHours (response, placeid) {
    const status = 'OK';

    chai.expect(response).to.be.an('object').that.has.property('status');
    chai.expect(response).to.be.an('object').that.has.property('result');
    chai.expect(response.result).to.be.an('object').that.has.property('place_id');
    chai.expect(response.result).to.be.an('object').that.has.property('opening_hours');
    chai.expect(response.status).to.be.a('string').that.is.equal(status);
    chai.expect(response.result.place_id).to.be.a('string').that.is.equal(placeid);
    chai.expect(response.result.opening_hours).to.be.an('object').that.has.property('open_now');
    chai.expect(response.result.opening_hours).to.be.an('object').that.has.property('periods');
}

function testViewModelOpeningHours (item, placeRequestSuccessful) {
    chai.expect(item).to.be.an('object').that.has.property('OpeningHours');
    chai.expect(item.OpeningHours).to.be.an('object').that.has.property('Known');
    chai.expect(item.OpeningHours).to.be.an('object').that.has.property('Days');
    chai.expect(item.OpeningHours.Known).to.be.a('boolean');
    chai.expect(item.OpeningHours.Known).to.be.equals(placeRequestSuccessful);
    chai.expect(item.OpeningHours.Days).to.be.an('array');
}

const { placeDetail, mergeOpeningHours, ignoreOpeningHours } = require('../google/index');
describe('Place Detail requests', function() {
    it('retrieves opening hours for a valid place ID and handles success and failure', function() {

        const placeid = 'ChIJGyyRpNXfbEgRXShsuyTRxfk';
        const sampleCoords = {
            lat: 50.285187,
            lng: -3.780388999999999
        };
        const sampleSearchResult = {
            name: 'name',
            icon: 'icon',
            geometry: {
                location: sampleCoords
            }
        };

        return placeDetail({ placeid })
        .then(response => {

            const responseData = response.data;
            testPlaceDetailOpeningHours(responseData, placeid);

            const mergedItem = mergeOpeningHours(sampleSearchResult, response, sampleCoords);
            testViewModelOpeningHours(mergedItem, true);

            const fallbackItem = ignoreOpeningHours(sampleSearchResult, sampleCoords);
            testViewModelOpeningHours(fallbackItem, false);

        });
    });
    
});