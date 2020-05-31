const path = require('path')
const express = require('express');
const doSearch = require('./search');

const webServer = express();
webServer.set('view engine', 'raz');
webServer.use(express.static(path.join(__dirname, '../wwwroot')));

// Search Routes
webServer
    .route('/:latitude/:longitude')
    .get(doSearch)

webServer
    .route('/search')
    .get(doSearch)


// Catch-all route
webServer
    .get('*', (_req, res, _next) => {
        res.render('default', {
            title: 'Instructions'
        });
    });

module.exports = webServer;