// ASSUMPTION: .env file exists in root or PLACES_KEY environment variable has been set
// ASSUMPTION: application started via npm start which has restored all the required packages

const dotenv = require('dotenv').config();
const open = require('opn');

if (dotenv.error) {
    throw dotenv.error;
}
else if (dotenv.parsed.PLACES_KEY) {
    console.log('API key found in .env');
}
else {
    console.warn('No API key found in .env');
}


const webServer = require('./routing/index');

const PORT = process.env.PORT || 8080;

webServer.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});

open(`http://localhost:${PORT}`);
