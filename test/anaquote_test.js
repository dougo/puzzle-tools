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
  assert.hasClass('mono', $select)
  let opts = Array.from($select.prop('options'))
  assert.equal(['___', ...trigrams], opts.map(o => o.text))
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

test('selecting non-blank option removes it from other selects', () => {
  let trigrams = ['HEL', 'LOW', 'ORL', 'D']
  let $el = $('<div>')
  setTrigrams($el, trigrams)
  let $first = $el.children().first()
  let $last = $el.children().last()
  function optionValues($select) { return Array.from($select.prop('options'), o => o.value) }
  assert.includes(optionValues($first), 'LOW')
  assert.includes(optionValues($last),  'LOW')
  $first.val('LOW').change()
  assert.includes(optionValues($first), 'LOW')
  refute.includes(optionValues($last),  'LOW')

  $first.val('ORL').change()
  // Put LOW back into other selects.
  assert.includes(optionValues($last),  'LOW')

  $first.val('___').change()
  // Don't remove blank from other selects.
  assert.includes(optionValues($last),  '___')

  $first.val('HEL').change()
  // Don't put blank back into other selects again!
  assert.equal(1, optionValues($last).filter(v => v === '___').length)
})
