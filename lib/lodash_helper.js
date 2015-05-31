'use strict';

var _ = require('lodash');

_.inherits = function inherits(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = _.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

module.exports = _;
