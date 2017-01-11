const { load, assert, refute, $ } = require('./test_helper')

load('anaquote/anaquote.js')

suite('Anaquote')

test('options', () => {
  let model = new Anaquote()
  model.trigrams = ['HEL', 'LOW', 'ORL', 'D']
  assert.equal(['___', 'HEL', 'LOW', 'ORL', 'D'], model.options(0))
  assert.equal(['___', 'HEL', 'LOW', 'ORL', 'D'], model.options(3))
})

test('selection and select', () => {
  let model = new Anaquote()
  model.trigrams = ['HEL', 'LOW', 'ORL', 'D']
  assert.equal('___', model.selection(0))
  assert.equal('___', model.selection(3))

  model.select(0, 'HEL')
  model.select(3, 'D')
  assert.equal('HEL', model.selection(0))
  assert.equal('D', model.selection(3))
})

test('quotation', () => {
  let model = new Anaquote()
  model.trigrams = ['HEL', 'LOW', 'ORL', 'D']
  model.enumeration = '5 5!'
  assert.equal('HELLO WORLD!', model.quotation())
})

suite('AnaquoteView')

test('buildSelect', () => {
  let view = new AnaquoteView($('<div>')[0])
  view.model.trigrams = ['HEL', 'LOW', 'ORL', 'D']
  let $select = view.buildSelect()
  assert.is('select', $select)
  assert.hasClass('mono', $select)
  let opts = Array.from($select.prop('options'))
  assert.equal(view.model.options(0), opts.map(o => o.text))
  assert.equal(view.model.options(0), opts.map(o => o.value))
  // TODO: use model.selection(0)
})

test('constructor', () => {
  let $el = $('<div>')
  let view = new AnaquoteView($el[0])
  assert.equal($el[0], view.el)
  assert.equal($el, view.$el)
  assert.instanceOf(Anaquote, view.model)
})

test('render', () => {
  let view = new AnaquoteView($('<div>')[0])
  view.model.trigrams = ['HEL', 'LOW', 'ORL', 'D']
  assert.equal(view, view.render())
  assert.equal(4, view.$el.children().length)
  let $select = view.$el.children().first()
  assert.is('select', $select)
  assert.equal(5, $select.prop('options').length)
})

test('render empties $el first', () => {
  let view = new AnaquoteView($('<div><div>')[0])
  view.model.trigrams = ['HEL', 'LOW', 'ORL', 'D']
  view.render()
  assert.equal(4, view.$el.children().length)
})

test('selecting non-blank option removes it from other selects', () => {
  let view = new AnaquoteView($('<div>')[0])
  view.model.trigrams = ['HEL', 'LOW', 'ORL', 'D']
  let $el = view.render().$el

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
