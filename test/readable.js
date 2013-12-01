var co = require('co')
var assert = require('assert')
var Scream = require('../')

describe('Scream', function () {
  describe('Readable', function () {
    it('should push and read', function (done) {
      var stream = new Scream({
        highWaterMark: 2
      })

      // push routine
      co(function* () {
        var i = 1

        while (i <= 10)
          yield stream.push(i++)

        stream.push(null)
      })()

      // pull routine
      co(function* () {
        var res = []
        var obj
        while (obj = yield* stream.read()) {
          assert.ok(stream._readableState.buffer.length <= 2)
          res.push(obj)
          assert.ok(stream._readableState.buffer.length <= 2)
        }

        res.should.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      })(done)
    })

    it('should yield* stream.reading()', function (done) {
      var stream = new Scream({
        highWaterMark: 2
      })

      // push routine
      co(function* () {
        yield* stream.reading()

        var i = 1

        while (i <= 10)
          yield stream.push(i++)

        stream.push(null)
      })()

      co(function* () {
        yield setImmediate
        assert.equal(stream._readableState.buffer.length, 0)
        assert.ok(!stream._readableState.reading)

        yield setImmediate
        assert.equal(stream._readableState.buffer.length, 0)
        assert.ok(!stream._readableState.reading)

        var res = []
        var obj
        while (obj = yield* stream.read()) {
          assert.ok(stream._readableState.reading)
          assert.ok(stream._readableState.buffer.length <= 2)
          res.push(obj)
          assert.ok(stream._readableState.reading)
          assert.ok(stream._readableState.buffer.length <= 2)
        }

        res.should.eql([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      })(done)
    })

    it('should push and throw errors', function (done) {
      var stream = new Scream()

      co(function* () {
        stream.push(new Error('boom'))
      })()

      co(function* () {
        yield* stream.read()
      })(function (err) {
        assert.equal(err.message, 'boom')
        done()
      })
    })
  })
})