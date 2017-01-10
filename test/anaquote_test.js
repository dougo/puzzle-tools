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
  let opts = [...$select[0].options]
  assert.equal(['___', ...trigrams], opts.map(o => o.value))
})
