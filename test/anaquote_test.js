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

test('selecting non-blank option removes it from other options', () => {
  let model = new Anaquote()
  model.trigrams = ['HEL', 'LOW', 'ORL', 'D']

  model.select(0, 'LOW')
  assert.includes(model.options(0), 'LOW')
  refute.includes(model.options(3), 'LOW')

  model.select(0, 'ORL')
  // Put LOW back into other selects.
  assert.includes(model.options(3),  'LOW')

  model.select(0, '___')
  // Don't remove blank from other selects.
  assert.includes(model.options(3),  '___')

  model.select(0, 'HEL')
  // Don't put blank back into other selects again!
  assert.equal(1, model.options(3).filter(v => v === '___').length)
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
  view.model.select(0, 'HEL')
  let $select = view.buildSelect(0)
  assert.is('select', $select)
  assert.hasClass('mono', $select)
  let opts = Array.from($select.prop('options'))
  assert.equal(view.model.options(0), opts.map(o => o.text))
  assert.equal(view.model.options(0), opts.map(o => o.value))
  assert.equal('HEL', $select.val())

  $select = view.buildSelect(1)
  opts = Array.from($select.prop('options'))
  assert.equal(view.model.options(1), opts.map(o => o.value))
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

test('selecting an option updates the model and re-renders', () => {
  let view = new AnaquoteView($('<div>')[0])
  view.model.trigrams = ['HEL', 'LOW', 'ORL', 'D']
  let $el = view.render().$el
  
  $el.children().first().val('LOW').change()
  assert.equal('LOW', view.model.selection(0))
  let lastOpts = Array.from(view.$el.children().last().prop('options'))
  refute.includes(lastOpts.map(o => o.value), 'LOW')
})
