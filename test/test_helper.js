const fs = require('fs')
const vm = require('vm')
$ = require('jquery')

function load(filename) {
  vm.runInThisContext(fs.readFileSync(__dirname + '/../' + filename))
}


// TODO: make the below into a minitest-jquery package?

const { assert, refute, utils } = require('minitest')

assert.is = (selector, $obj, msg) => {
  assert($obj.is(selector), utils.message(msg, `Expected ${$obj.prop('outerHTML')} to match '${selector}'`))
}

module.exports = { load, assert, refute, $ }
