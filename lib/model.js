'use strict';

var EventEmitter = require('events').EventEmitter;

var assert = require('assert-plus');

var _ = require('./lodash_helper');

module.exports = function (client, options) {
	assert.ok(client instanceof require('./clients').JsonClient);
	assert.object(options, 'options');

	// merge data returned by a REST response
	options.mergeData = options.mergeData || function (doc, data) {
		_.extend(doc.data, data.data || data);
	};

	function Document(data) {
		this.neu = true;
		this.data = data || {};
	}
	_.inherits(Document, EventEmitter);

	// save a new document
	Document.prototype.post = function (data, callback) {
		assert.ok(this.neu, 'document is not new, cannot create');

		var opts = {
			method: 'post',
			url: options.name,
		};

		var self = this;

		return this.write(opts, data, function (err) {
			if (!err) {
				self.neu = false;
			}

			if (typeof callback === 'function') {
				callback.apply(this, arguments);
			}
		});
	};

	// get a document
	Document.prototype.get = function (callback) {
		assert.fail(this.neu, 'document is new, therefore unsaved');
		assert.string(this.id, 'document.id');

		var opts = {
			method: 'get',
			url: options.name + '/' + this.id,
		};

		return this.write(opts, callback);
	};

	Document.prototype.del = function (callback) {
		assert.fail(this.neu, 'document is new, therefore unsaved');
		assert.string(this.id, 'document.id');

		var opts = {
			method: 'del',
			url: options.name + '/' + this.id,
		};

		return this.write(opts, callback);
	}

	// save a document
	Document.prototype.put = function (data, callback) {
		assert.fail(this.neu, 'document is new, therefore unsaved, cannot update');
		assert.string(this.id, 'document.id');

		var opts = {
			method: 'put',
			url: options.name + '/' + this.id,
		};

		return this.write(opts, data, callback);
	};

	// save a document (new or old)
	Document.prototype.save = function (data, callback) {
		if (this.neu) {
			return this.post(data, callback);
		} else {
			return this.put(data, callback);
		}
	};

	Document.prototype.write = function (opts, data, callback) {
		if (typeof data === 'function') {
			callback = data;
			data = {};
		}

		assert.object(opts);
		assert.optionalObject(data, 'data');
		assert.optionalFunc(callback);

		_.extend(this.data, data);

		var method = opts.method.toLowerCase();

		if (method === 'get') {
			client[method](opts.url, this.parse(callback));
		} else {
			client[method](opts.url, this.data, this.parse(callback));
		}

		return this;
	};

	// handles the response returned by the client
	Document.prototype.parse = function (callback) {
		var self = this;

		return function (err, req, obj) {
			if (err) {
				callback(err);
				self.emit('error', err);
				return;
			}

			self.emit('beforeMerge', obj);

			options.mergeData(self, obj);

			self.emit('afterMerge', obj);

			self.emit('sync');
			callback.call(self, err, self, req, obj)
		};
	};

	//
	// ---- MODEL METHODS ----
	//

	Document.get = function (id, callback) {
		assert.ok(typeof id === 'string' || typeof id === 'number', 'id');

		var model = new Document();
		model.neu = false;
		model.id = String(id);
		model.get(callback);

		return model;
	};

	// alias
	Document.getById = Document.get;

	return Document;
};
