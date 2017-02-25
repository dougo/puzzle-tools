const fs = require('fs')
const vm = require('vm')
const jsdom = require('jsdom')
const sinon = require('sinon')

// Put these into the global namespace so that the file under test can use them.
URL = require('url').URL
$ = require('jquery')

function load(filename) {
  vm.runInThisContext(fs.readFileSync(__dirname + '/../' + filename))
}


const { assert, refute, utils } = require('minitest')

// TODO: add to minitest.js?

assert.defined = (obj, msg) => {
  refute(obj === undefined, utils.message(msg, 'Expected %{obj} to be defined', { obj: obj }))
}
refute.defined = (obj, msg) => {
  assert(obj === undefined, utils.message(msg, 'Expected %{obj} to be undefined', { obj: obj }))
}

// TODO: make the below into a minitest-jquery package?

assert.is = (selector, $obj, msg) => {
  assert($obj.is(selector),
         utils.message(msg, `Expected ${$obj.prop('outerHTML')} to match '${selector}'`))
}

assert.has = (selector, $obj, msg) => {
  assert($obj.has(selector).length > 0,
         utils.message(msg, `Expected ${$obj.prop('outerHTML')} to have a descendant that matches '${selector}'`))
}

refute.has = (selector, $obj, msg) => {
  refute($obj.has(selector).length > 0,
         utils.message(msg, `Expected ${$obj.prop('outerHTML')} to have no descendants that match '${selector}'`))
}

assert.hasClass = (className, $obj, msg) => {
  assert($obj.hasClass(className),
         utils.message(msg, `Expected ${$obj.prop('outerHTML')} to have class '${className}'`))
}

assert.hasText = (text, $obj, msg) => {
  assert(text === $obj.text(),
         utils.message(msg, `Expected ${$obj.prop('outerHTML')} to have text '${text}'`))
}

assert.hasValue = (value, $obj, msg) => {
  let actual = $obj.val()
  assert(value === actual,
         utils.message(msg, `Expected ${$obj.prop('outerHTML')} to have value '${value}',`
                       + ` but the value was '${actual}'`))
}

assert.hasAttr = (name, value, $obj, msg) => {
  let actual = $obj.attr(name)
  assert(value === actual,
         utils.message(msg, `Expected ${$obj.prop('outerHTML')} to have a '${name}' attribute`
                       + ` with the value '${value}', but the value was '${actual}'`))
}

assert.hasProp = (name, value, $obj, msg) => {
  let actual = $obj.prop(name)
  assert(value === actual,
         utils.message(msg, `Expected ${$obj.prop('outerHTML')} to have a '${name}' property`
                       + ` with the value '${value}', but the value was '${actual}'`))
}

module.exports = { load, assert, refute, jsdom, sinon }
