'use strict';

var assert = require('assert-plus');

var _ = require('../lodash_helper');
var httpErrors = require('./http_error');

function RestError(options) {
    assert.object(options, 'options');

    options.constructorOpt = options.constructorOpt || RestError;
    Error.apply(this, arguments);

    this.restCode = options.restCode || 'Error';
    this.message = options.message;    
    this.body = options.body;
}

RestError.prototype = Error.prototype;

module.exports = {
    RestError: RestError
};
