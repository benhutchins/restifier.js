// Because we are constructing error objects dynamically, we use an anonymous
// function as the 'base constructor' then use arguments.callee to fill that in.
// strict mode disallows agruments.callee, disable both of these rules.

/* eslint-disable strict, no-caller */

var assert = require('assert-plus');

var _ = require('../lodash_helper');
var http_status_codes = require('./http_status_codes');

var slice = Function.prototype.call.bind(Array.prototype.slice);

function codeToErrorName(code) {
    code = parseInt(code, 10);
    var status = http_status_codes[code];

    if (!status) {
        return (false);
    }


    var pieces = status.split(/\s+/);
    var str = '';
    pieces.forEach(function (s) {
        str += s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    });

    str = str.replace(/\W+/g, '');

    if (!/\w+Error$/.test(str)) {
        str += 'Error';
    }

    return (str);
}

function HttpError(options) {
    assert.object(options, 'options');

    options.constructorOpt = options.constructorOpt || HttpError;
    Error.apply(this, arguments);

    var self = this;
    var code = parseInt((options.statusCode || 500), 10);
    this.statusCode = code;
    this.body = options.body || {
        code: codeToErrorName(code),
        message: options.message || self.message
    };
    this.message = options.message || self.message;
}

HttpError.prototype = Error.prototype;

function TimeoutError(ms) {
    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, TimeoutError);
    }

    this.message = 'connect timeout after ' + ms + 'ms';
    this.name = 'TimeoutError';
}

TimeoutError.prototype = Error.prototype;

module.exports = {

    HttpError: HttpError,
    TimeoutError: TimeoutError,

    codeToHttpError: function codeToHttpError(code, message, body) {
        var err;
        var name = codeToErrorName(code);

        if (!name) {
            err = new HttpError({
                statusCode: code,
                message: message,
                body: body
            });
            err.name = 'Http' + code + 'Error';
        } else {
            err = new module.exports[name]({
                body: body,
                message: message,
                constructorOpt: codeToHttpError,
                statusCode: code
            });
        }

        return (err);
    }

};

// Export all the 4xx and 5xx HTTP Status codes as Errors
var codes = _.keys(http_status_codes);

codes.forEach(function (code) {
    if (code < 400) {
        return;
    }

    var name = codeToErrorName(code);

    module.exports[name] = function (cause, message) {
        var index = 1;
        var opts = {
            statusCode: code
        };

        if (cause && cause instanceof Error) {
            opts.cause = cause;
            opts.constructorOpt = arguments.callee;
        } else if (typeof (cause) === 'object') {
            opts.body = cause.body;
            opts.cause = cause.cause;
            opts.constructorOpt = cause.constructorOpt;
            opts.message = cause.message;
            opts.statusCode = cause.statusCode || code;
        } else {
            opts.constructorOpt = arguments.callee;
            index = 0;
        }

        var args = slice(arguments, index);
        args.unshift(opts);
        HttpError.apply(this, args);
    };
    _.inherits(module.exports[name], HttpError);

    module.exports[name].displayName = module.exports[name].prototype.name = name;
});
