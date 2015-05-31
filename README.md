# restifier.js

restifier.js is a simple client-side utility that pairs with [node-restify](http://mcavage.me/node-restify/). It is heavily based on restify's client classes, but redesigned for use as a client side library.

## How to use

Incude the script:

```html
<script type="text/javascript" src="restifier.js"></script>
```

Then construct a client:

```javascript
var client = restifier.createJsonClient('https://api.myservice.com/');
```

Now call an api method:

```javascript
// call post on the client
var data = {
    content: 'Something is going on here...',
};

client.post('/note', data, function (err, json) {
    if (err) {
        // yes, you should do something when there is an error...
    } else {
        // probably should do something on success too...
    }
});
```

## Clients

Creating a server is straightforward, as you simply invoke the createClient API, which takes an options object with the options listed below:

```javascript
var client = restifier.createClient();
```

There are actually three separate clients shipped in restifier:

* ***JsonClient***: sends and expects application/json
* ***StringClient***: sends url-encoded request and expects text/plain
* ***HttpClient***: thin wrapper over node's http/https libraries

The idea being that if you want to support "typical" control-plane REST APIs, you probably want the JsonClient, or if you're using some other serialization (like XML) you'd write your own client that extends the StringClient. If you need streaming support, you'll need to do some work on top of the HttpClient, as StringClient and friends buffer requests/responses.

All clients support retry with exponential backoff for getting a TCP connection; they do not perform retries on 5xx error codes like previous versions of the restify client. You can set retry to false to disable this logic altogether. Also, all clients support a connectTimeout field, which is use on each retry. The default is not to set a connectTimeout, so you end up with the node.js socket defaults.

Here's an example of hitting the Joyent CloudAPI:

```js
// Creates a JSON client
var client = restify.createJsonClient({
  url: 'https://us-west-1.api.joyentcloud.com'
});


client.basicAuth('$login', '$password');
client.get('/my/machines', function (err, req, res, obj) {
  assert.ifError(err);

  console.log(JSON.stringify(obj, null, 2));
});
```

As a short-hand, a client can be initialized with a string-URL rather than an options object:

```js
var client = restifier.createJsonClient('https://us-west-1.api.joyentcloud.com');
```

Note that all further documentation refers to the "short-hand" form of methods like `get/put/del` which take a string path. You can also pass in an object to any of those methods with extra params (notably headers):

```js
var options = {
  path: '/foo/bar',
  headers: {
    'x-foo': 'bar'
  },
  retry: {
    'retries': 0
  },
  agent: false
};

client.get(options, function (err, req, res) { .. });
```

If you need to interpose additional headers in the request before it is sent on to the server, you can provide a synchronous callback function as the signRequest option when creating a client. This is particularly useful with node-http-signature, which needs to attach a cryptographic signature of selected outgoing headers. If provided, this callback will be invoked with a single parameter: the outgoing http.ClientRequest object.

### JsonClient

The JSON Client is the highest-level client bundled with restify; it exports a set of methods that map directly to HTTP verbs. All callbacks look like `function(err, req, res, [obj])`, where `obj` is optional, depending on if content was returned. HTTP status codes are not interpreted, so if the server returned 4xx or something with a JSON payload, `obj` will be the JSON payload.  `err` however will be set if the server returned a status code >= 400 (it will be one of the restify HTTP errors). If `obj` looks like a `RestError`:

```json
{
  "code": "FooError",
  "message": "some foo happened"
}
```

then `err` gets "upconverted" into a `RestError` for you. Otherwise it will be an `HttpError`.

#### createJsonClient(options)

```js
var client = restify.createJsonClient({
  url: 'https://api.us-west-1.joyentcloud.com',
  version: '*'
});
```

Options:

Name       | Type    | Description
---------- | ------- | -----------
accept     | String  | Accept header to send
timeout    | Number  | Amount of time to wait for a socket
headers    | Object  | HTTP headers to set in all requests
url        | String  | Fully-qualified URL to connect to
version    | String  | semver string to set the accept-version

#### get(path, callback)

Performs an HTTP get; if no payload was returned, `obj` defaults to `{}` for you (so you don't get a bunch of null pointer errors).

```js
client.get('/foo/bar', function(err, req, res, obj) {
  assert.ifError(err);
  console.log('%j', obj);
});
```

#### head(path, callback)

Just like `get`, but without `obj`:

```js
client.head('/foo/bar', function(err, req, res) {
  assert.ifError(err);
  console.log('%d -> %j', res.statusCode, res.headers);
});
```

#### post(path, object, callback)

Takes a complete object to serialize and send to the server.

```js
client.post('/foo', { hello: 'world' }, function(err, req, res, obj) {
  assert.ifError(err);
  console.log('%d -> %j', res.statusCode, res.headers);
  console.log('%j', obj);
});
```

#### put(path, object, callback)

Just like `post`:

```js
client.put('/foo', { hello: 'world' }, function(err, req, res, obj) {
  assert.ifError(err);
  console.log('%d -> %j', res.statusCode, res.headers);
  console.log('%j', obj);
});
```

#### del(path, callback)

`del` doesn't take content:

```js
client.del('/foo/bar', function(err, req, res) {
  assert.ifError(err);
  console.log('%d -> %j', res.statusCode, res.headers);
});
```

### StringClient

`StringClient` is what `JsonClient` is built on, and provides a base for you to write other buffering/parsing clients (like say an XML client). If you need to talk to some "raw" HTTP server, then `StringClient` is what you want, as it by default will provide you with content uploads in `application/x-www-form-url-encoded` and downloads as `text/plain`. To extend a `StringClient`, take a look at the source for `JsonClient`. Effectively, you extend it, and set the appropriate options in the constructor and implement a `write` (for put/post) and `parse` method (for all HTTP bodies), and that's it.

#### createStringClient(options)

```js
var client = restify.createStringClient({
  url: 'https://example.com'
})
```

#### get(path, callback)

Performs an HTTP get; if no payload was returned, `data` defaults to `''` for you (so you don't get a bunch of null pointer errors).

```js
client.get('/foo/bar', function(err, req, res, data) {
  assert.ifError(err);
  console.log('%s', data);
});
```

#### head(path, callback)

Just like `get`, but without data:

client.head('/foo/bar', function(err, req, res) {
  assert.ifError(err);
  console.log('%d -> %j', res.statusCode, res.headers);
});
```

#### post(path, object, callback)

Takes a complete object to serialize and send to the server.

```js
client.post('/foo', { hello: 'world' }, function(err, req, res, data) {
  assert.ifError(err);
  console.log('%d -> %j', res.statusCode, res.headers);
  console.log('%s', data);
});
```

#### put(path, object, callback)

Just like `post`:

```js
client.put('/foo', { hello: 'world' }, function(err, req, res, data) {
  assert.ifError(err);
  console.log('%d -> %j', res.statusCode, res.headers);
  console.log('%s', data);
});
```

#### del(path, callback)

`del` doesn't take content, since you know, it should't:

```js
client.del('/foo/bar', function (err, req, res) {
  if (err) { ... }
  console.log('%d -> %j', res.status, res.headers);
});
```

### HttpClient

`HttpClient` is the lowest-level client shipped in restifier, and is basically just some sugar over the `XMLHttpRequest` class.

```js
client = restify.createClient({
  url: 'http://127.0.0.1'
});

client.get('/str/mcavage', function (err, req) {
  // req will be an XMLHttpRequest object
});
```

Or a write:

```js
client.post(opts, function(err, req) {
  assert.ifError(connectErr);

  req.on('result', function(err, res) {
    assert.ifError(err);
    res.body = '';
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      res.body += chunk;
    });

    res.on('end', function() {
      console.log(res.body);
    });
  });

  req.write('hello world');
  req.end();
});
```

Has all the same methods exist as `JsonClient/StringClient`.

One wishing to extend the `HttpClient` should look at the internals and note that read and write probably need to be overridden.

#### basicAuth(username, password)

Since it hasn't been mentioned yet, this convenience method (available on all clients), just sets the Authorization header for all HTTP requests:

```js
client.basicAuth('mark', 'mysupersecretpassword');
```
