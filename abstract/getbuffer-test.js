var db
  , verifyNotFoundError = require('./util').verifyNotFoundError
  , isTypedArray        = require('./util').isTypedArray

module.exports.setUp = function (NoSqlDatabase, test, testCommon) {
  test('setUp common', testCommon.setUp)
  test('setUp db', function (t) {
    db = NoSqlDatabase(testCommon.location())
    db.open(t.end.bind(t))
  })
}

module.exports.args = function (test) {
}

var destBuffer = new Buffer(8192)
function testDestBuffer(t, err, len, expected, offset) {
  t.error(err)
  t.equal(len, expected.length)
  if (typeof offset !== 'number') offset = 0
  result = destBuffer.toString(null, offset, offset+expected.length)
  t.equal(result, expected)
  destBuffer.fill(0, offset, offset+expected.length)
}
module.exports.getBuffer = function (test) {
  test('test simple getBuffer()', function (t) {
    db.put('foo', 'bar', function (err) {
      t.error(err)
      db.getBuffer('foo', destBuffer, function (err, len) {
        testDestBuffer(t, err, len, 'bar')

        db.getBuffer('foo', destBuffer, {}, function (err, len) { // same but with {}
          testDestBuffer(t, err, len, 'bar')

          db.getBuffer('foo', destBuffer, { offset: 3 }, function (err, len) {
            testDestBuffer(t, err, len, 'bar', 3)
            t.end()
          })
        })
      })
    })
  })

  test('test simultaniously get()', function (t) {
    db.put('hello', 'world', function (err) {
      t.error(err)
      var r = 0
        , done = function () {
            if (++r == 20)
              t.end()
          }
        , i = 0
        , j = 0

      for (; i < 10; ++i)
        db.getBuffer('hello', destBuffer, function(err, value) {
          testDestBuffer(t, err, len, 'world')
          done()
        })

      for (; j < 10; ++j)
        db.getBuffer('not found', destBuffer, function(err, value) {
          t.ok(err, 'should error')
          t.ok(verifyNotFoundError(err), 'should have correct error message')
          t.ok(typeof value == 'undefined', 'value is undefined')
          done()
        })
    })
  })
}

module.exports.tearDown = function (test, testCommon) {
  test('tearDown', function (t) {
    db.close(testCommon.tearDown.bind(null, t))
  })
}

module.exports.sync = function (test) {
  test('sync', function (t) {
    if (db._getBufferSync) {
      delete db.__proto__._getBuffer
    }
    t.end()
  })
}

module.exports.all = function (NoSqlDatabase, test, testCommon) {
  module.exports.setUp(NoSqlDatabase, test, testCommon)
  module.exports.args(test)
  module.exports.getBuffer(test)
  if (NoSqlDatabase.prototype._getBufferSync) {
    module.exports.sync(test)
    module.exports.getBuffer(test)
  }
  module.exports.tearDown(test, testCommon)
}
