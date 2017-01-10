const { assert, refute } = require('minitest')
const anaquote = require('../anaquote/anaquote')

suite('fillIn')

test('empty', () => {
  assert.equal('', anaquote.fillIn('', []))
})

test('hello world', () => {
  let trigrams = ['HEL', 'LOW', 'ORL', 'D']
  let enumeration = '5 5!'
  assert.equal('HELLO WORLD!', anaquote.fillIn(enumeration, trigrams))
})
