const { load, assert, refute, $ } = require('./test_helper')

load('anaquote/anaquote.js')

suite('fillIn')

test('empty', () => {
  assert.equal('', fillIn('', []))
})

test('hello world', () => {
  let trigrams = ['HEL', 'LOW', 'ORL', 'D']
  let enumeration = '5 5!'
  assert.equal('HELLO WORLD!', fillIn(enumeration, trigrams))
})

suite('trigramSelect')

test('options are trigrams plus blank', () => {
  let trigrams = ['HEL', 'LOW', 'ORL', 'D']
  let $select = trigramSelect(trigrams)
  assert.is('select', $select)
  let opts = [...$select.prop('options')]
  assert.equal(['___', ...trigrams], opts.map(o => o.value))
})

suite('setTrigrams')

test('adds selects to $el', () => {
  let trigrams = ['HEL', 'LOW', 'ORL', 'D']
  let $el = $('<div>')
  setTrigrams($el, trigrams)
  assert.equal(4, $el.children().length)
  let $select = $el.children().first()
  assert.is('select', $select)
  assert.equal(5, $select.prop('options').length)
})

test('empties $el first', () => {
  let trigrams = ['HEL', 'LOW', 'ORL', 'D']
  let $el = $('<div><div>')
  setTrigrams($el, trigrams)
  assert.equal(4, $el.children().length)
})
