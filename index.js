'use strict';

var restifier = require('./lib/index.js');

module.exports = restifier;

if (typeof global !== 'undefined' && global.window) {
	global.window.restifier = restifier;
}
