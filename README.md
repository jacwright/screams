# Screams [![Build Status](https://travis-ci.org/cojs/screams.png)](https://travis-ci.org/cojs/screams)

Simpler object streams using generators.
Intended to mimic node's streams but without complexity.
There are no more event emitters and fewer states to handle.
Designed to be used with [co](https://github.com/visionmedia/co).

You might be interested in [archan](https://github.com/cojs/archan).

## Example

### Readable Stream

```js
var Scream = require('screams')

var stream = new Scream({
  highWaterMark: 2
})

// push routine
co(function* () {
  yield* this.reading()

  var i = 1

  while (i <= 10)
    yield stream.push(i++)

  stream.push(null)
})()

// pull routine
co(function* () {
  var res = []
  var obj

  while (obj = yield* stream.read())
    res.push(obj)

  res.should.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
})(done)
```

## API

### var stream = new Scream([options])

Options:

- `highWaterMark: 16` - maximum number of items to store in the buffer.

### stream.onerror = function (err) {}

This is called if any errors occur that are otherwise not handled.
By default, it just throws the error.
This is basically the same as `.on('error', listener)`.

### Readable Properties

#### For consumers

##### yield* stream.read()

Returns the next object in the stream.
This is it - there are no `readable` or `data` events.
If there's no data to read from the buffer,
it'll wait until there is.

#### For implementors

##### yield* stream.reading()

If the stream is currently being consumed, this will yield immediately.
Otherwise, it will yield the first time `.read()` is called.

This eliminates the need for an implementable `._read()` method - just push data in a separate coroutine.

You can ignore this if you want to just push data to the stream immediately.
In node, you have to do `.read(0)` to signify that.

##### [yield] stream.push(val)

Push a value to a stream.

Note that in the example, we signify the end of the stream by pushing a `null` value.
However, if we pushed `0`, then the while loop would consider that the end of the stream.
Handling the values and consumption is up to the implementor.

If you push an error,
that error will be thrown when the consumer `.read()`s that value.
That doesn't necessarily mean the stream is ended though - you can have a stream of `Error`s whose values must be caught each time.

`yield` is optional and is meant to handle backpressure.
If the buffer length is below the high water mark,
it will yield immediately,
otherwise it will wait until a "drain" event.

##### stream.pipe(stream, [options])

NOT YET IMPLEMENTED

`stream` can be `Scream` or a node `Stream.Writable` instance.
Backpressure is handled correctly.

Options:

- `end` - call `stream.end()` when the source stream is done.

##### stream.unpipe(stream, [options])

NOT YET IMPLEMENTED

`stream` can be `Scream` or a node `Stream.Writable` instance.

### Writable Properties

NOT YET IMPLEMENTED

#### For consumers

##### [yield] stream.write(val)

NOT YET IMPLEMENTED

Write a value to the stream.
`yield` is optional and is meant to handle back pressure.
If the buffer length is below the high water mark,
it will yield immediately,
otherwise it will wait until the next "drain" event.

Note: backpressure is not compatible with node streams.

##### [yield] stream.end([val])

NOT YET IMPLEMENTED

Signify the end of the stream.
`yield` is optional.
If you `yield`,
it will suspend execution until the stream is flushed (i.e. the `finish` event).

#### For implementors

##### stream._write = function* (val) {}

NOT YET IMPLEMENTED

An implementable generator function.
This method _must_ be implemented if the stream is to be used as a writable stream.
For example, a pass through stream would just be:

```js
stream._write = function* (val) {
  yield this.push(val)
}
```

##### stream._flush = function* () {}

NOT YET IMPLEMENTED

An optional implementable generator function.
This method is called after all the writes have been flushed.

## License

The MIT License (MIT)

Copyright (c) 2013 Jonathan Ong me@jongleberry.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.