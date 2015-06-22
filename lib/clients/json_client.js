'use strict';

var _ = require('../lodash_helper');

var assert = require('assert-plus');

var codeToHttpError = require('../errors/http_error').codeToHttpError;
var errors = require('../errors');
var StringClient = require('./string_client');

function JsonClient(options) {
    assert.object(options, 'options');

    options.accept = 'application/json';
    options.name = options.name || 'JsonClient';
    options.contentType = 'application/json';

    StringClient.call(this, options);
}
_.inherits(JsonClient, StringClient);

JsonClient.prototype.write = function write(options, body, callback) {
    assert.object(options, 'options');
    assert.ok(body !== undefined, 'body');
    assert.object(body, 'body');

    body = JSON.stringify(body !== null ? body : {});

    return (JsonClient.super_.prototype.write.call(this, options, body, callback));
};

JsonClient.prototype.parse = function parse(req, callback) {
    // var log = this.log;
    var data = req.responseText;

    var obj;
    var err;

    try {
        if (data && !/^\s*$/.test(data)) {
            obj = JSON.parse(data);
        }
    } catch (e) {
        // Not really sure what else we can do here, besides
        // make the client just keep going.
        this.log.trace(e, 'Invalid JSON in response');
    }

    obj = obj || {};

    if (req.status >= 400) {
        // Upcast error to a RestError (if we can)
        // Be nice and handle errors like
        // { error: { code: '', message: '' } }
        // in addition to { code: '', message: '' }.
        if (obj.code || (obj.error && obj.error.code)) {
            var _c = obj.code || (obj.error ? obj.error.code : '') || '';
            var _m = obj.message || (obj.error ? obj.error.message : '') || '';

            err = new errors.RestError({
                message: _m,
                restCode: _c,
                statusCode: req.status,
                body: obj
            });

            err.name = err.restCode;

            if (!/Error$/.test(err.name)) {
                err.name += 'Error';
            }
        } else if (!err) {
            err = codeToHttpError(req.status, obj.message || '', data);
        }
    }

    if (err) {
        err.body = obj;
    }

    callback((err || null), req, obj);

    return this;
};

module.exports = JsonClient;
