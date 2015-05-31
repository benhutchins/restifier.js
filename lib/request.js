'use strict';

var url = require('url');

var assert = require('assert-plus');

var _ = require('./lodash_helper');
var errors = require('./errors');

module.exports = function rawRequest(opts, cb) {
    assert.object(opts, 'options');
    assert.func(cb, 'callback');

    cb = _.once(cb);

    var timeoutTimer;
    var req;

    if (opts.timeout) {
        timeoutTimer = setTimeout(function connectTimeout() {
            timeoutTimer = null;

            if (req) {
                req.abort();
            }

            var err = new errors.TimeoutError(opts.timeout);
            cb(err, req);
        }, opts.timeout);
    }

    req = new XMLHttpRequest();

    opts.pathname = opts.path;

    req.open(opts.method, url.format(opts), true, opts.username, opts.password);

    if (opts.headers) {
        _.each(opts.headers, function (value, key) {
            req.setRequestHeader(key, value);
        });
    }

    req.onload = function onResponse() {
        clearTimeout(timeoutTimer);

        var err;

        if (req.status >= 400) {
            err = errors.codeToHttpError(req.status);
        }

        cb((err || null), req);
    };

    req.onerror = function onError(err) {
        opts.log.trace({err: err}, 'Request failed');
        clearTimeout(timeoutTimer);

        cb(err, req);

        if (req) {
            req.abort();
        }
    };

    // req.ontimeout
    // req.onloadstart
    // req.onloadend
    // req.onabort
    // req.onprogress

    // this can still fail if cross-origin is not setup properly
    // there is no way to detect that, so it triggers the timeout catch
    req.send(opts.body || null);

    if (opts.log.trace) {
        opts.log.trace({client_req: opts}, 'request sent');
    }
};
