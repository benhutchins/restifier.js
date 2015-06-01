'use strict';

var _ = require('../lodash_helper');
var httpErrors = require('./http_error');
var restErrors = require('./rest_error');

module.exports = _.extend({}, httpErrors, restErrors);
