const axios = require('axios');
const { getDistance } = require('../geo/index');

// ASSUMPTION: Google API urls are stable enough to not need specifying in a config file

/** The base URL for Google Place Search request */
const URL_SEARCH =
  'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

/** The base URL for Google Place Detail request */
const URL_PLACE = 'https://maps.googleapis.com/maps/api/place/details/json';

/** Constructs a URL for a request from a base URL and an object contatining parameters */
const constructRequestUrl = (url, queryParameters) => {
  queryParameters.key = process.env.PLACES_KEY;
  const serialisedParameters = Object.keys(queryParameters)
    .map((p) => `${p}=${queryParameters[p]}`)
    .join('&');
  return `${url}?${serialisedParameters}`;
};

const waitForNext = async (pagetoken) => {
  await new Promise((r) => setTimeout(r, 2000));
  return await axios.get(
    constructRequestUrl(URL_SEARCH, {
      pagetoken
    })
  );
};

const handleError = (response) => {
  let errorMessage;
  switch (response.data.status) {
    case 'OK':
    case 'ZERO_RESULTS':
      break;

    case 'OVER_QUERY_LIMIT':
      errorMessage = 'Over query limit';
      break;

    case 'REQUEST_DENIED':
      errorMessage = 'Invalid API key';
      break;

    case 'INVALID_REQUEST':
      errorMessage = 'Invalid request';
      break;

    case 'UNKNOWN_ERROR':
    default:
      errorMessage = 'An unknown error occurred';
  }

  if (!errorMessage) return;

  let e = new Error(errorMessage);
  e.apiResonseError = true;

  throw e;
};

// BEGIN EXPORTED FUNCTIONS

/**
 * Sends and returns the results of a Place Search request
 * (together with any subsequent pages) with given parameters
 */
const placeSearch = async (parameters) => {
  const pages = [];

  const processPage = (page) => {
    handleError(page);
    pages.push(page);
    return page.data.next_page_token;
  };

  // Places API free tier only returns a maximum of 60 results (in three pages)
  let pagetoken = processPage(
    await axios.get(constructRequestUrl(URL_SEARCH, parameters))
  );
  for (let i = 0; i < 2; i++) {
    if (pagetoken) {
      pagetoken = processPage(await waitForNext(pagetoken));
    }
  }

  return pages.flatMap((p) => p.data.results);
};

/** Sends and returns the results of a Place Detail request with the given parameters */
const placeDetail = async (parameters) => {
  const url = constructRequestUrl(URL_PLACE, parameters);
  return await axios.get(url);
};

/**
 * Returns an item for the view model resulting from merging the Opening Hours
 * details of a Place Detail request into the appropriate item from a Place Search request
 */
const mergeOpeningHours = (searchResult, detailResult, requestCoords) => {
  return {
    Name: searchResult.name,
    Icon: searchResult.icon,
    Rating: searchResult.rating,
    Distance: getDistance(
      [requestCoords.lat, requestCoords.lng],
      [searchResult.geometry.location.lat, searchResult.geometry.location.lng]
    ),
    OpeningHours: ((hoursResponse) => {
      let oh = {
        Known: !!hoursResponse,
        Days: []
      };

      if (oh.Known) {
        oh.OpenNow = hoursResponse.open_now;
        oh.OpenAlways =
          hoursResponse.periods[0].open.day === 0 &&
          !hoursResponse.periods[0].close;
        if (!oh.OpenAlways) {
          const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
          oh.Days = hoursResponse.periods.map((p) => ({
            day: days[p.open.day],
            open: p.open.time,
            close: p.close.time
          }));
        }
      }

      return oh;
    })(detailResult.data.result.opening_hours)
  };
};

/**
 * Returns an item for the view model where the Opening Hours are marked as unknown,
 * in case of an error in a Place Detail request
 */
const ignoreOpeningHours = (searchResult, requestCoords) => {
  return {
    Name: searchResult.name,
    Icon: searchResult.icon,
    Rating: searchResult.rating,
    Distance: getDistance(
      [requestCoords.lat, requestCoords.lng],
      [searchResult.geometry.location.lat, searchResult.geometry.location.lng]
    ),
    OpeningHours: {
      Known: false,
      Days: []
    }
  };
};

module.exports = {
  placeSearch,
  placeDetail,
  mergeOpeningHours,
  ignoreOpeningHours
};
