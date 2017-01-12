const { load, assert, refute, $ } = require('./test_helper')

load('anaquote/anaquote.js')

suite('Anaquote')

test('constructor', () => {
  assert.equal('', new Anaquote('').enumeration)
  let model = new Anaquote('HEL LOW ORL D', '5 5!')
  assert.equal(['HEL', 'LOW', 'ORL', 'D'], model.trigrams)
  assert.equal(['???', '???', '???', '???'], model.selections)
  assert.equal('5 5!', model.enumeration)
  assert.equal(['???', '?? ?', '???', '?!'], model.blanks)
})

test('options', () => {
  let model = new Anaquote('HEL LOW ORL D')
  assert.equal(['???', 'HEL', 'LOW', 'ORL', 'D'], model.options(0))
  assert.equal(['???', 'HEL', 'LOW', 'ORL', 'D'], model.options(3))
})

test('selection and select', () => {
  let model = new Anaquote('HEL LOW ORL D')
  assert.equal('???', model.selection(0))
  assert.equal('???', model.selection(3))

  model.select(0, 'HEL')
  model.select(3, 'D')
  assert.equal('HEL', model.selection(0))
  assert.equal('D', model.selection(3))
})

test('selecting non-blank option removes it from other options', () => {
  let model = new Anaquote('HEL LOW ORL D')
  model.select(0, 'LOW')
  assert.includes(model.options(0), 'LOW')
  refute.includes(model.options(3), 'LOW')

  model.select(0, 'ORL')
  // Put LOW back into other selects.
  assert.includes(model.options(3),  'LOW')

  model.select(0, '???')
  // Don't remove blank from other selects.
  assert.includes(model.options(3),  '???')

  model.select(0, 'HEL')
  // Don't put blank back into other selects again!
  assert.equal(1, model.options(3).filter(v => v === '???').length)
})

test('makeBlanks', () => {
  assert.equal(['???'], Anaquote.makeBlanks('3'))
  assert.equal(['???', '??'], Anaquote.makeBlanks('5'))
  assert.equal([' ???', '??'], Anaquote.makeBlanks(' 5'))
  assert.equal(['???', '?? ?', '???', '?!'], Anaquote.makeBlanks('5 5!'))
  assert.equal(['???,'], Anaquote.makeBlanks('3,'))
})

test('fillInBlank', () => {
  let model = new Anaquote('', '5 5!')
  assert.equal('HEL', model.fillInBlank(0, 'HEL'))
  assert.equal('D??', model.fillInBlank(0, 'D'))
  assert.equal('LO W', model.fillInBlank(1, 'LOW'))
  assert.equal('D? ?', model.fillInBlank(1, 'D'))
  assert.equal('ORL', model.fillInBlank(2, 'ORL'))
  assert.equal('D!', model.fillInBlank(3, 'D'))
  assert.equal('H!', model.fillInBlank(3, 'HEL'))
})

test('formattedOptions', () => {
  let model = new Anaquote('HEL LOW ORL D', '5 5!')
  assert.equal([['???', '?? ?'], ['HEL', 'HE L'], ['LOW', 'LO W'], ['ORL', 'OR L'], ['D', 'D? ?']],
               model.formattedOptions(1))
})

test('quotation', () => {
  let model = new Anaquote('HEL LOW ORL D', '5 5!')
  assert.equal('????? ?????!', model.quotation())
  model.select(0, 'HEL')
  model.select(1, 'LOW')
  model.select(2, 'ORL')
  model.select(3, 'D')
  assert.equal('HELLO WORLD!', model.quotation())
})

suite('TrigramSelectionView')

test('constructor', () => {
  let model = new Anaquote('HEL LOW ORL D')
  let view = new TrigramSelectionView(model, 0)
  assert.same(model, view.model)
  assert.equal(0, view.i)
  assert.is('select', view.$el)
  assert.hasClass('mono', view.$el)
  assert.empty(view.$el.children())
})

test('$options', () => {
  let view = new TrigramSelectionView()
  assert.empty(view.$options)
  view.$el.append('<option>foo</option>', '<option>bar</option>')
  assert.equal(['foo', 'bar'], view.$options.map(o => o.value))
})

test('render', () => {
  let view = new TrigramSelectionView(new Anaquote('HEL LOW ORL D', '5  5!'), 1)
  assert.equal(view, view.render())
  let $el = view.$el
  let opts = view.$options
  assert.equal(['???', 'HEL', 'LOW', 'ORL', 'D'], opts.map(o => o.value))
  assert.equal('??&nbsp;&nbsp;?', opts[0].text)
  assert.hasValue('???', $el)

  view.model.select(1, 'HEL')
  view.render()
  assert.equal(['???', 'HEL', 'LOW', 'ORL', 'D'], view.$options.map(o => o.value))
  assert.hasValue('HEL', $el)

  view.model.select(2, 'LOW')
  view.render()
  assert.equal(['???', 'HEL', 'ORL', 'D'], view.$options.map(o => o.value))
})

test('selecting an option updates the model', () => {
  let view = new TrigramSelectionView(new Anaquote('HEL LOW ORL D', '5 5!'), 0)
  let $el = view.render().$el
  $el.val('LOW').change()
  assert.equal('LOW', view.model.selection(0))
})


suite('TrigramsView')

test('constructor', () => {
  let model = new Anaquote('HEL LOW ORL D', '5 5!')
  let view = new TrigramsView(model)
  assert.is('p', view.$el)
  assert.same(model, view.model)
  assert.equal(4, view.subviews.length)

  let subview = view.subviews[0]
  assert.instanceOf(TrigramSelectionView, subview)
  assert.same(view.model, subview.model)
  assert.equal(0, subview.i)

  assert.equal(4, view.$el.children().length)
  assert.equal(subview.$el[0], view.$el.children()[0])
})

test('render', () => {
  let view = new TrigramsView(new Anaquote('HEL LOW ORL D', '5 5!'))
  let subview0 = view.subviews[0]
  let subview1 = view.subviews[1]
  view.model.select(0, 'LOW')
  assert.same(view, view.render())
  assert.equal(5, subview0.$options.length)
  assert.hasValue('LOW', subview0.$el)
  assert.equal(['???', 'HEL', 'ORL', 'D'], subview1.$options.map(o => o.value))
})

suite('QuotationView')

test('constructor', () => {
  let model = new Anaquote('HEL LOW ORL D', '5 5!')
  let view = new QuotationView(model)
  assert.same(model, view.model)
  assert.is('p', view.$el)
})

test('render', () => {
  let view = new QuotationView(new Anaquote('HEL LOW ORL D', '5 5!'))
  assert.same(view, view.render())
  assert.hasText('????? ?????!', view.$el)
})

suite('AnaquoteView')

test('constructor', () => {
  let model = new Anaquote('HEL LOW ORL D', '5 5!')
  let view = new AnaquoteView('<div>', model)
  assert.is('div', view.$el)
  assert.same(model, view.model)

  assert.instanceOf(QuotationView, view.quotation)
  assert.same(model, view.quotation.model)
  assert.same(view.quotation.$el[0], view.$el.children()[0])

  assert.instanceOf(TrigramsView, view.trigrams)
  assert.same(model, view.trigrams.model)
  assert.same(view.trigrams.$el[0], view.$el.children()[1])
})

test('render', () => {
  let view = new AnaquoteView('<div>', new Anaquote('HEL LOW ORL D', '5 5!'))
  assert.same(view, view.render())
  assert.equal(5, view.trigrams.subviews[0].$options.length)
  assert.hasText('????? ?????!', view.quotation.$el)
})

test('selecting an option re-renders', () => {
  let view = new AnaquoteView('<div>', new Anaquote('HEL LOW ORL D', '5 5!')).render()
  view.trigrams.subviews[1].$el.val('LOW').change()
  refute.includes(view.trigrams.subviews[0].$options.map(o => o.value), 'LOW')
  assert.hasText('???LO W????!', view.quotation.$el)
})
