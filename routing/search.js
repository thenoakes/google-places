const isValidCoordinates = require('is-valid-coordinates');
const {
  placeSearch,
  placeDetail,
  mergeOpeningHours,
  ignoreOpeningHours
} = require('../google/index');

/**
 * Performs the search for a request to
 * /{latitude}/{longitude} or /search?latitude={latitude}&longitude={longitude}
 */
const doSearch = async (req, res, _next) => {
  const parseCoords = (paramsOrQuery) => {
    const lat = parseFloat(paramsOrQuery.latitude);
    const lng = parseFloat(paramsOrQuery.longitude);
    return {
      lat,
      lng,
      valid: isValidCoordinates(lng, lat)
    };
  };

  let coords = {
    lat: NaN,
    lng: NaN,
    valid: false
  };

  if (req.params.latitude && req.params.longitude) {
    coords = parseCoords(req.params);
  } else if (req.query.latitude && req.query.longitude) {
    coords = parseCoords(req.query);
  }

  if (!coords.valid) {
    return res.sendStatus(400).end();
  }

  // ASSUMPTION: there is no immediate requirement for customisation of seach criteria
  /** Place Search parameters */
  const placeSearchParams = {
    location: `${coords.lat},${coords.lng}`,
    radius: 1000
  };

  const searchResults = await placeSearch(placeSearchParams);

  const viewModel = {
    title: 'Results',
    latitude: coords.lat,
    longitude: coords.lng,
    results: []
  };

  const workToDo = [];

  for (const r of searchResults) {
    /** Place Detail parameters */
    const placeDetailParams = {
      placeid: r.place_id
    };

    const task = (async () => {
      try {
        const detailResult = await placeDetail(placeDetailParams);
        const successModel = mergeOpeningHours(r, detailResult, coords);
        viewModel.results.push(successModel);
      } catch {
        const errorModel = ignoreOpeningHours(r, coords);
        viewModel.results.push(errorModel);
      }
    })();
    workToDo.push(task);
  }

  // When all of the promises have resolved, the view model will be complete
  await Promise.all(workToDo);
  // ASSUMPTION: FontAwesome and Bulma assets are accessible from their own CDN servers
  res.render('results', viewModel);
};

module.exports = doSearch;
