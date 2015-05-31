'use strict';

var EventEmitter = require('events').EventEmitter;
var url = require('url');

var assert = require('assert-plus');

var _ = require('../lodash_helper');
var rawRequest = require('../request');

function HttpClient(options) {
    assert.object(options, 'options');
    assert.object(options.log, 'options.log');
    assert.optionalObject(options.headers, 'options.headers');
    assert.optionalString(options.url, 'options.url');

    EventEmitter.call(this);

    this.timeout = options.timeout || false;
    this.headers = options.headers || {};
    this.log = options.log;
    this.name = options.name || 'HttpClient';

    this.url = options.url ? url.parse(options.url) : {};

    if (options.accept) {
        this.headers.accept = options.accept;
    }

    if (options.contentType) {
        this.headers['content-type'] = options.contentType;
    }

    if (options.version) {
        this.headers['accept-version'] = options.version;
    }
}
_.inherits(HttpClient, EventEmitter);

HttpClient.prototype.del = function del(options, callback) {
    var opts = this._options('DELETE', options);

    return (this.read(opts, callback));
};

HttpClient.prototype.get = function get(options, callback) {
    var opts = this._options('GET', options);

    return (this.read(opts, callback));
};

HttpClient.prototype.head = function head(options, callback) {
    var opts = this._options('HEAD', options);

    return (this.read(opts, callback));
};

HttpClient.prototype.opts = function http_options(options, callback) {
    var _opts = this._options('OPTIONS', options);

    return (this.read(_opts, callback));
};

HttpClient.prototype.post = function post(options, callback) {
    var opts = this._options('POST', options);

    return (this.request(opts, callback));
};

HttpClient.prototype.put = function put(options, callback) {
    var opts = this._options('PUT', options);

    return (this.request(opts, callback));
};

HttpClient.prototype.patch = function patch(options, callback) {
    var opts = this._options('PATCH', options);


    return (this.request(opts, callback));
};

HttpClient.prototype.read = function read(options, callback) {
    var r = this.request(options, function readRequestCallback(err, req) {
        return (callback(err, req));
    });
    return (r);
};

HttpClient.prototype.basicAuth = function basicAuth(username, password) {
    if (username === false) {
        delete this.headers.authorization;
    } else {
        assert.string(username, 'username');
        assert.string(password, 'password');

        this.username = username;
        this.password = password;
    }

    return (this);
};

HttpClient.prototype.request = function request(opts, cb) {
    assert.object(opts, 'options');
    assert.func(cb, 'callback');

    cb = _.once(cb);

    rawRequest(opts, cb);
};

HttpClient.prototype._options = function (method, options) {
    if (typeof (options) !== 'object') {
        options = { path: options };
    }

    var self = this;
    var opts = {
        timeout: options.timeout || this.timeout,
        headers: options.headers || {},
        log: options.log || this.log,
        method: method,
        path: options.path || this.path,
        username: this.username || null,
        password: this.password || null,
    };

    Object.keys(this.url).forEach(function (k) {
        if (!opts[k]) {
            opts[k] = self.url[k];
        }
    });

    opts.headers = _.extend({}, this.headers, opts.headers);

    if (method === 'GET' || method === 'HEAD' || method === 'DELETE') {
        if (opts.headers['content-type']) {
            delete opts.headers['content-type'];
        }

        if (opts.headers['content-md5']) {
            delete opts.headers['content-md5'];
        }

        if (opts.headers['transfer-encoding']) {
            delete opts.headers['transfer-encoding'];
        }
    }

    return (opts);
};

module.exports = HttpClient;
