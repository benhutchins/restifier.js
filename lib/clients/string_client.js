'use strict';

// var crypto = require('crypto');

var assert = require('assert-plus');
var qs = require('querystring');

var _ = require('../lodash_helper');
var HttpClient = require('./http_client');

function StringClient(options) {
    assert.object(options, 'options');

    options.accept = options.accept || 'text/plain';
    options.name = options.name || 'StringClient';
    options.contentType = options.contentType || 'application/x-www-form-urlencoded';

    HttpClient.call(this, options);
}
_.inherits(StringClient, HttpClient);

StringClient.prototype.post = function post(options, body, callback) {
    var opts = this._options('POST', options);

    if (typeof (body) === 'function') {
        callback = body;
        body = null;
    }

    return (this.write(opts, body, callback));
};

StringClient.prototype.put = function put(options, body, callback) {
    var opts = this._options('PUT', options);

    if (typeof (body) === 'function') {
        callback = body;
        body = null;
    }

    return (this.write(opts, body, callback));
};

StringClient.prototype.patch = function patch(options, body, callback) {
    var opts = this._options('PATCH', options);

    if (typeof (body) === 'function') {
        callback = body;
        body = null;
    }

    return (this.write(opts, body, callback));
};

StringClient.prototype.read = function read(options, callback) {
    var self = this;
    this.request(options, function _parse(err, req) {
        if (err) {
            return (callback(err, req));
        }

        req.once('result', self.parse(req, callback));
        return (req.end());
    });
    return (this);
};

StringClient.prototype.write = function write(options, body, callback) {
    if (body !== null && typeof (body) !== 'string') {
        body = qs.stringify(body);
    }

    var self = this;

    function _write(data) {
        // if (data) {
        //     var hash = crypto.createHash('md5');
        //     hash.update(data, 'utf8');
        //     options.headers['content-md5'] = hash.digest('base64');
        // }

        self.request(options, function (err, req) {
            if (err) {
                callback(err, req);
                return;
            }

            req.once('result', self.parse(req, callback));
            req.end(data);
        });
    }

    options.headers = options.headers || {};

    if (body) {
        options.headers['content-length'] = body.length;
        _write(body);
    } else {
        _write();
    }

    return (this);
};


StringClient.prototype.parse = function parse(req, callback) {
    function parseResponse(err, res) {
        var body = '';
        // var hash;
        // var md5;

        function done() {
            res.log.trace('body received:\n%s', body);
            res.body = body;

            // if (hash && md5 !== hash.digest('base64')) {
            //     err = new Error('BadDigest');
            //     callback(err, req, res);
            //     return;
            // }

            if (err) {
                err.body = body;
                err.message = body;
            }

            callback(err, req, res, body);
        }

        if (res) {
            // md5 = res.headers['content-md5'];

            // if (md5 && req.method !== 'HEAD' && res.statusCode !== 206) {
            //     hash = crypto.createHash('md5');
            // }

            res.setEncoding('utf8');
            res.once('end', done);

            res.on('data', function onData(chunk) {
                // if (hash) {
                //     hash.update(chunk);
                // }

                body += chunk;
            });

        } else {
            callback(err, req, null, null);
        }
    }

    return (parseResponse);
};

module.exports = StringClient;
