'use strict';

var HttpClient = require('./http_client');
var JsonClient = require('./json_client');
var StringClient = require('./string_client');

module.exports = {
    HttpClient: HttpClient,
    JsonClient: JsonClient,
    StringClient: StringClient
};
