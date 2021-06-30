function sort(criterion, descending) {
  // Get the elements for each item
  var items = [].slice.call(document.querySelectorAll('.search-result'));

  // Sort by the passed data- attribute
  items.sort(function (a, b) {
    if (a.dataset[criterion] < b.dataset[criterion]) {
      return descending ? 1 : -1;
    } else if (a.dataset[criterion] > b.dataset[criterion]) {
      return descending ? -1 : 1;
    }

    // If sorting by name, nothing more to do
    if (criterion === 'gpName') return 0;

    // Otherwise, use Name ASCENDING as a secondary criterion
    if (a.dataset.gpName < b.dataset.gpName) {
      return -1;
    } else if (a.dataset.gpName > b.dataset.gpName) {
      return 1;
    }

    return 0;
  });

  // Reorder the elements
  var resultsContainer = document.getElementById('search-results');

  for (var i = 0; i < items.length; i++) {
    resultsContainer.appendChild(items[i]);
  }
}

function updateSortDescription(criterion) {
  var description = '';
  switch (criterion) {
    case 'gpName':
      description = 'sorted alphabetically';
      break;
    case 'gpRating':
      description = 'showing best rated first';
      break;
    case 'gpDistance':
      description = 'showing closest first';
      break;
    case 'gpOpen':
      description = 'showing currently open first';
      break;
  }
  document.getElementById('sort-description').innerText = description;
}

document
  .getElementById('result-sorter')
  .addEventListener('click', function (evt) {
    if (evt.target.classList.contains('result-sort')) {
      var field = evt.target.dataset.gpField;
      var criterion = 'gp' + field;
      sort(criterion, field === 'Rating' || field === 'Open');
      updateSortDescription(criterion);
    }
  });

document.addEventListener('DOMContentLoaded', function () {
  var defaultSortCriterion = 'gpDistance';
  sort(defaultSortCriterion);
  updateSortDescription(defaultSortCriterion);
});
