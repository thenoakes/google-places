const axios = require('axios');
const { getDistance } = require('../geo/index');

// ASSUMPTION: Google API urls are stable enough to not need specifying in a config file

/** The base URL for Google Place Search request */
const URL_SEARCH = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

/** The base URL for Google Place Detail request */
const URL_PLACE = 'https://maps.googleapis.com/maps/api/place/details/json';

/** Constructs a URL for a request from a base URL and an object contatining parameters */
const constructRequestUrl = (url, queryParameters) => {

  queryParameters.key = process.env.PLACES_KEY;
  const serialisedParameters = Object.keys(queryParameters)
    .map(p => `${p}=${queryParameters[p]}`)
    .join('&');
  return `${url}?${serialisedParameters}`;

}

/** Waits, constructs, sends and appends the results of a Place Search follow-up request  */
const appendNextResponse = (previousResponses, token) => {
  const nextPageUrl = constructRequestUrl(URL_SEARCH, {
    pagetoken: token
  });
  return new Promise(resolve => {
    // The next page isn't ready for a couple of seconds
    setTimeout(function () {
      axios.get(nextPageUrl).then(nextResponse => {
        if (nextResponse.data.status === 'OK') {
          previousResponses.push(nextResponse);
          resolve(previousResponses);
        }
      });
    }, 2000);
  });
}

const generateApiError = (response) => {
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

  return e;
}

// BEGIN EXPORTED FUNCTIONS

/** 
 * Sends and returns the results of a Place Search request 
 * (together with any subsequent pages) with given parameters 
 */
const placeSearch = (parameters) => {

  // Original request
  const url = constructRequestUrl(URL_SEARCH, parameters);

  // Chain subsequent requests (up to two further results pages) and combine results
  return axios.get(url)
    .then(firstPage => {

      const apiError = generateApiError(firstPage);

      if (apiError) {
        throw apiError;
      }

      if (firstPage.data.next_page_token) {
        return appendNextResponse([firstPage], firstPage.data.next_page_token);
      }
      else {
        return [firstPage];
      }
    })
    .then(pages => {
      if (pages[pages.length - 1].data.next_page_token) {
        return appendNextResponse(pages, pages[pages.length - 1].data.next_page_token);
      }
      else {
        return pages;
      }
    })
    .then(pages => {
      let r = [];
      for (let resultSet of pages) {
        r.push(...resultSet.data.results);
      }
      return r;
    })
    .catch(err => {
      console.error(err);
      throw err;
    });

};

/** Sends and returns the results of a Place Detail request with the given parameters */
const placeDetail = (parameters) => {

  const url = constructRequestUrl(URL_PLACE, parameters);
  return axios.get(url);

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
      [searchResult.geometry.location.lat, searchResult.geometry.location.lng]),
    OpeningHours: ((hoursResponse) => {

      let oh = {
        Known: !!hoursResponse,
        Days: []
      };

      if (oh.Known) {
        oh.OpenNow = hoursResponse.open_now;
        oh.OpenAlways = (hoursResponse.periods[0].open.day === 0 && !hoursResponse.periods[0].close);
        if (!oh.OpenAlways) {
          const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
          oh.Days = hoursResponse.periods.map(p => ({
            day: days[p.open.day],
            open: p.open.time,
            close: p.close.time
          }));
        }
      };

      return oh;

    })(detailResult.data.result.opening_hours)
  }
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
      [searchResult.geometry.location.lat, searchResult.geometry.location.lng]),
    OpeningHours: {
      Known: false,
      Days: []
    }
  }
};


module.exports = {
  placeSearch,
  placeDetail,
  mergeOpeningHours,
  ignoreOpeningHours
}