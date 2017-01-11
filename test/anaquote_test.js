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

suite('TrigramSelectionView')

test('constructor', () => {
  let model = new Anaquote()
  model.trigrams = ['HEL', 'LOW', 'ORL', 'D']
  let view = new TrigramSelectionView(model, 0)
  assert.equal(model, view.model)
  assert.equal(0, view.i)
  assert.is('select', view.$el)
  assert.hasClass('mono', view.$el)
  assert.empty(view.$el.children())
})

test('render', () => {
  let model = new Anaquote()
  let view = new TrigramSelectionView(model, 0)
  model.trigrams = ['HEL', 'LOW', 'ORL', 'D']
  assert.equal(view, view.render())
  let $el = view.$el
  let opts = Array.from($el.prop('options'))
  assert.equal(['___', 'HEL', 'LOW', 'ORL', 'D'], opts.map(o => o.text))
  assert.equal(['___', 'HEL', 'LOW', 'ORL', 'D'], opts.map(o => o.value))
  assert.equal('___', $el.val())

  model.select(0, 'HEL')
  view.render()
  assert.equal(['___', 'HEL', 'LOW', 'ORL', 'D'], Array.from($el.prop('options')).map(o => o.value))
  assert.equal('HEL', $el.val())

  model.select(1, 'LOW')
  view.render()
  assert.equal(['___', 'HEL', 'ORL', 'D'], Array.from($el.prop('options')).map(o => o.value))
})

test('selecting an option updates the model', () => {
  let model = new Anaquote()
  model.trigrams = ['HEL', 'LOW', 'ORL', 'D']
  let view = new TrigramSelectionView(model, 0)
  let $el = view.render().$el
  $el.val('LOW').change()
  assert.equal('LOW', view.model.selection(0))
})


suite('AnaquoteView')

test('constructor', () => {
  let view = new AnaquoteView('<div>')
  assert.is('div', view.$el)
  assert.instanceOf(Anaquote, view.model)
})

test('buildSubviews', () => {
  let view = new AnaquoteView('<div>')
  view.model.trigrams = ['HEL', 'LOW', 'ORL', 'D']
  view.buildSubviews()
  assert.equal(4, view.subviews.length)
  let subview = view.subviews[0]
  assert.instanceOf(TrigramSelectionView, subview)
  assert.equal(view.model, subview.model)
  assert.equal(0, subview.i)
})

test('render', () => {
  let view = new AnaquoteView('<div>')
  view.model.trigrams = ['HEL', 'LOW', 'ORL', 'D']
  assert.equal(view, view.render())
  assert.equal(4, view.subviews.length)
  assert.equal(4, view.$el.children().length)
  let $select = view.$el.children().first()
  assert.is('select', $select)
  assert.equal(5, $select.prop('options').length)
})

test('render empties $el first', () => {
  let view = new AnaquoteView('<div><div>')
  view.model.trigrams = ['HEL', 'LOW', 'ORL', 'D']
  view.render()
  assert.equal(4, view.$el.children().length)
})

test('renderSubviews', () => {
  let view = new AnaquoteView('<div>')
  view.model.trigrams = ['HEL', 'LOW', 'ORL', 'D']
  view.render()
  let subview0 = view.subviews[0]
  let subview1 = view.subviews[1]
  view.model.select(0, 'LOW')
  view.renderSubviews()
  assert.equal('LOW', subview0.$el.val())
  assert.equal(['___', 'HEL', 'ORL', 'D'], Array.from(subview1.$el.prop('options')).map(o => o.value))
})

test('selecting an option re-renders subviews', () => {
  let view = new AnaquoteView('<div>')
  view.model.trigrams = ['HEL', 'LOW', 'ORL', 'D']
  view.render()
  let subview = view.subviews[0]
  let $el = subview.$el
  $el.val('LOW').change()
  assert.equal(subview, view.subviews[0])
  assert.equal($el, view.subviews[0].$el)
  assert.equal('LOW', subview.$el.val())
})
