const geolib = require('geolib');

// ASSUMPTION: validation of the co-ordinates has already been passed

const getDistance = (latLonA, latLonB) => {

    return geolib.getDistance(
        {
            latitude: latLonA[0],
            longitude: latLonA[1]
        },
        {
            latitude: latLonB[0],
            longitude: latLonB[1]
        }
    );

}

module.exports = {
    getDistance
}