'use strict';

var assert = require('assert-plus');

var _ = require('./lodash_helper');
var clients = require('./clients');
var model = require('./model');

function createClient (options) {
    if (typeof (options) === 'string') {
        options = {
            url: options
        };
    }

    assert.object(options, 'options');

    var client;
    var opts = _.clone(options);
    opts.agent = options.agent;
    opts.name = opts.name || 'restify';
    opts.type = opts.type || 'application/octet-stream';
    opts.log = opts.log || require('./log');

    switch (opts.type) {
        case 'json':
            client = new clients.JsonClient(opts);
            break;

        case 'string':
            client = new clients.StringClient(opts);
            break;

        case 'http':
        default:
            client = new clients.HttpClient(opts);
            break;
    }

    return (client);
}

function createJsonClient(options) {
    if (typeof (options) === 'string') {
        options = {
            url: options
        };
    }

    options = options ? _.clone(options) : {};
    options.type = 'json';
    return (createClient(options));
}

function createStringClient(options) {
    if (typeof (options) === 'string') {
        options = {
            url: options
        };
    }

    options = options ? _.clone(options) : {};
    options.type = 'string';
    return (createClient(options));
}

function createHttpClient(options) {
    if (typeof (options) === 'string') {
        options = {
            url: options
        };
    }

    options = options ? _.clone(options) : {};
    options.type = 'http';
    return (createClient(options));
}

module.exports = {
    createClient: createClient,
    createJsonClient: createJsonClient,
    createStringClient: createStringClient,
    createHttpClient: createHttpClient,

    errors: require('./errors'),
};
