# Places / list view project

## Configuration

An installation of node.js with the npm package manager are required to run the project.

This application requires an API key for the Google Places API requests. This should be provided via environment variable `PLACES_KEY`.

Either, (1) create a text file `.env` at the root of the project after cloning it, in which the variable's value is set, or (2) set it before running any commands.

### 1. `.env` file

The command
```
echo PLACES_KEY={key} > .env
```
will create the appropriate `.env` file, where `{key}` should be replaced the Google Places API key you wish to use.

Alternatively, create the file manually with the contents of the form `PLACES_KEY={key}`.

### 2. Manual

Set the environment variable `PLACES_KEY` via the command line before running a command e.g. 
```
PLACES_KEY={key} npm start
```

### Port number

The default port number 8080 of the web server can also be overriden via
```
PORT={port number}
```
either in the `.env` file or manually.


## Tests

To run tests, in a terminal at the root directory of the project, run
```
npm test
```
The results of the tests will be displayed in the terminal window.

(Prefix the command with `PLACES_KEY={key}` in the absence of a `.env` file.)

## Usage

To use this application, in a terminal at the root directory of the project, run

```
npm start
```

This will install npm dependencies, start the web server and launch the default web browser.

To perform a search, please enter a URL suffix of either of the following forms:
```
/{latitude}/{longitude}
/search?latitude={latitude}&longitude={longitude}
```
where `{latitude}` and `{longitude}` are valid signed decimals representing the respective co-ordinates.

Attempting to navigate to any other root will also bring up a simple UI in which latitude and longitude co-ordinates can be entered.

For example:
```
http://localhost:8080/50.279708/-3.878748
```

There may be a small delay if there are a large number of results, as multiple requests must be made to the API.

If there are results, they will display in the browser window in ascending order of distance from the entered co-ordinates. Each result will display an icon, the place name, a rating (if provided) and opening hours (if provided). The entered co-ordinates and number of results are also displayed.

The list may be re-ordered by best rating, whether the place is currently open and alphabetically, by clicking on the appropriate link.

