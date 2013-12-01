module.exports = Scream

function Scream(options) {
  options = options || {}
  this._readableState = new ReadableState(options)
  this._writableState = new WritableState(options)
}

Scream.prototype.reading = function* () {
  var rs = this._readableState
  if (rs.reading)
    return

  yield rs.awaitReading
}

Scream.prototype.read = function* () {
  var rs = this._readableState
  var val

  if (!rs.reading)
    rs.callReading()

  if (rs.buffer.length) {
    val = rs.buffer.shift()
    setImmediate(rs.callNextPush)
    if (val instanceof Error)
      throw val
    else
      return val
  }

  yield rs.awaitNextRead
  return yield* this.read()
}

Scream.prototype.push = function (val) {
  if (arguments.length !== 1)
    throw new Error('wtf only 1 value man')

  var rs = this._readableState

  rs.buffer.push(val)

  rs.callNextRead() // probably do this next tick

  return rs.awaitNextPush
}

Scream.prototype.pipe = function (stream, options) {

}

Scream.prototype.unpipe = function (stream) {

}

Scream.prototype.write = function () {

}

Scream.prototype.end = function () {

}

Scream.prototype._write = function* (val) {
  throw new Error('not implemented')
}

Scream.prototype._flush = function* () {}

Scream.prototype.onerror = function (err) {
  throw err
}

function ReadableState(options) {
  this.highWaterMark = options.highWaterMark || 16

  this.buffer = []
  this.pushqueue = []
  this.readqueue = []
  this.readingqueue = []

  this.awaitReading = this.awaitReading.bind(this)
  // this.callReading = this.callReading.bind(this)
  this.awaitNextPush = this.awaitNextPush.bind(this)
  this.callNextPush = this.callNextPush.bind(this)
  this.awaitNextRead = this.awaitNextRead.bind(this)
  this.callNextRead = this.callNextRead.bind(this)
}

ReadableState.prototype = {
  get pushable() {
    return this.buffer.length < this.highWaterMark
  }
}

ReadableState.prototype.awaitReading = function (cb) {
  this.readingqueue.push(cb)
}

ReadableState.prototype.callReading = function () {
  this.reading = true

  while (this.readingqueue.length)
    this.readingqueue.shift()()
}

// yield immediately if buffer is below the high water mark
ReadableState.prototype.awaitNextPush = function (cb) {
  this.pushable
    ? cb()
    : this.pushqueue.push(cb)
}

// allow as many pushes until the high water mark
ReadableState.prototype.callNextPush = function () {
  while (this.pushqueue.length && this.pushable)
    this.pushqueue.shift()()
}

// assumes there's nothing in this.buffer currenctly
ReadableState.prototype.awaitNextRead = function (cb) {
  this.readqueue.push(cb)
}

// maximum one read call per push call
ReadableState.prototype.callNextRead = function () {
  if (this.readqueue.length)
    this.readqueue.shift()()
}

function WritableState(options) {
  this.highWaterMark = options.highWaterMark || 16

  this.buffer = []
  this.writequeue = []
}