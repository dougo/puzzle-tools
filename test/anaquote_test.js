const { load, assert, refute, jsdom, sinon } = require('./test_helper')

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

test('omit selected trigrams from other options', () => {
  let model = new Anaquote('HEL LOW ORL D')
  model.select(0, 'LOW')
  assert.includes(model.options(0), 'LOW')
  refute.includes(model.options(3), 'LOW')
})

test('allow duplicate selections if duplicate trigrams', () => {
  let model = new Anaquote('TSE TSE FLY')
  assert.equal(['???', 'TSE', 'TSE', 'FLY'], model.options(2))
  model.select(0, 'TSE')
  assert.equal(['???', 'TSE', 'FLY'], model.options(2))
  model.select(1, 'TSE')
  assert.equal(['???', 'FLY'], model.options(2))
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

suite('SelectionView')

class TestSelectionView extends SelectionView {
  render() { this.$el.append(`<option>${this.i}</option>`) }
}

test('constructor', () => {
  let model = new Anaquote('HEL LOW ORL D')
  let view = new TestSelectionView(model, 0)
  assert.same(model, view.model)
  assert.equal(0, view.i)
  assert.is('select', view.$el)
  assert.hasClass('mono', view.$el)
  assert.empty(view.$el.children())
})

test('$options', () => {
  let view = new TestSelectionView()
  assert.empty(view.$options)
  view.$el.append('<option>foo</option>', '<option>bar</option>')
  assert.equal(['foo', 'bar'], view.$options.map(o => o.value))
})

suite('SelectionsView')

class TestSelectionsView extends SelectionsView {
  get subviewClass () { return TestSelectionView }
  selections() { return [0,1,2,3] }
}

test('constructor', () => {
  let model = new Anaquote('HEL LOW ORL D', '5 5!')
  let view = new TestSelectionsView(model)
  assert.is('p', view.$el)
  assert.same(model, view.model)
  assert.equal(4, view.subviews.length)

  let subview = view.subviews[0]
  assert.instanceOf(TestSelectionView, subview)
  assert.same(view.model, subview.model)
  assert.equal(0, subview.i)

  assert.equal(4, view.$el.children().length)
  assert.same(subview.$el[0], view.$el.children()[0])
})

test('render renders subviews', () => {
  let view = new TestSelectionsView(new Anaquote('HEL LOW ORL D', '5 5!'))
  assert.same(view, view.render())
  assert.equal('0', view.subviews[0].$options[0].value)
  assert.equal('1', view.subviews[1].$options[0].value)
})

suite('TrigramSelectionView')

test('extends SelectionView', () => {
  assert.instanceOf(SelectionView, new TrigramSelectionView(new Anaquote(''), 0))
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

suite('WordSelectionView')

test('extends SelectionView', () => {
  assert.instanceOf(SelectionView, new WordSelectionView(new Anaquote(''), 0))
})

test('render', () => {
  let view = new WordSelectionView(new Anaquote('HEL LOW ORL D', '5,  5!'), 0)
  assert.equal(view, view.render())
  let $el = view.$el
  assert.hasValue('?????', $el)
})

suite('TrigramsView')

test('extends SelectionsView', () => {
  let model = new Anaquote('HEL LOW ORL D', '5 5!')
  let view = new TrigramsView(model)
  assert.instanceOf(SelectionsView, view)
  assert.same(TrigramSelectionView, view.subviewClass)
  assert.equal(model.selections, view.selections())
})

suite('WordsView')

test('extends SelectionsView', () => {
  let model = new Anaquote('HEL LOW ORL D', '5 5!')
  let view = new WordsView(model)
  assert.instanceOf(SelectionsView, view)
  assert.same(WordSelectionView, view.subviewClass)
  assert.equal([1,2], view.selections())
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
  let view = new AnaquoteView(model)
  assert.is('div', view.$el)
  assert.same(model, view.model)

  assert.instanceOf(QuotationView, view.quotation)
  assert.same(model, view.quotation.model)
  assert.same(view.quotation.$el[0], view.$el.children()[0])

  assert.instanceOf(TrigramsView, view.trigrams)
  assert.same(model, view.trigrams.model)
  assert.same(view.trigrams.$el[0], view.$el.children()[1])

  assert.instanceOf(WordsView, view.words)
  assert.same(model, view.words.model)
  assert.same(view.words.$el[0], view.$el.children()[2])
})

test('render', () => {
  let view = new AnaquoteView(new Anaquote('HEL LOW ORL D', '5 5!'))
  assert.same(view, view.render())
  refute.empty(view.trigrams.subviews[0].$options)
  refute.empty(view.words.subviews[0].$options)
  assert.hasText('????? ?????!', view.quotation.$el)
})

test('selecting an option re-renders', () => {
  let view = new AnaquoteView(new Anaquote('HEL LOW ORL D', '5 5!')).render()
  view.trigrams.subviews[1].$el.val('LOW').change()
  refute.includes(view.trigrams.subviews[0].$options.map(o => o.value), 'LOW')
  assert.hasText('???LO W????!', view.quotation.$el)
})

suite('InputView')

test('constructor', () => {
  jsdom.changeURL(window, 'http://example.com/?trigrams=HEL+LOW+ORL+D&enumeration=5+5!')
  let view = new InputView()
  assert.is('div', view.$el)
  let $children = view.$el.children('div')
  assert.equal(3, $children.length)
  assert.has(view.$trigrams, $children.eq(0))
  assert.has(view.$enumeration, $children.eq(1))
  assert.has(view.$start, $children.eq(2))

  assert.is('input[name=trigrams]', view.$trigrams)
  assert.hasAttr('placeholder', 'Trigrams', view.$trigrams)
  assert.hasAttr('size', '100', view.$trigrams)
  assert.hasValue('HEL LOW ORL D', view.$trigrams)

  assert.is('input[name=enumeration]', view.$enumeration)
  assert.hasAttr('placeholder', 'Enumeration', view.$enumeration)
  assert.hasAttr('size', '100', view.$enumeration)
  assert.hasValue('5 5!', view.$enumeration)

  assert.is('button', view.$start)
  assert.hasText('Start', view.$start)
})

test('newAnaquote', () => {
  let view = new InputView()
  view.$trigrams.val('HEL LOW ORL D')
  view.$enumeration.val('5 5!')
  let anaquote = view.newAnaquote()
  assert.instanceOf(Anaquote, anaquote)
  assert.equal(['HEL', 'LOW', 'ORL', 'D'], anaquote.trigrams)
  assert.equal('5 5!', anaquote.enumeration)
})

suite('ApplicationView')

test('constructor', () => {
  let $el = $('<div>')
  let view = new ApplicationView($el)
  assert.same($el, view.$el)
  assert.instanceOf(InputView, view.input)
  assert.same(view.input.$el[0], view.$el.children()[0])
  assert.instanceOf(Set, view.words)
  assert.equal(0, view.words.size)
})

test('clicking Start makes a new rendered AnaquoteView', () => {
  let view = new ApplicationView($('<div>'))
  view.input.$trigrams.val('HEL LOW ORL D')
  view.input.$enumeration.val('5 5!')
  view.input.$start.click()
  assert.instanceOf(AnaquoteView, view.anaquote)
  assert.equal(['HEL', 'LOW', 'ORL', 'D'], view.anaquote.model.trigrams)
  assert.equal('5 5!', view.anaquote.model.enumeration)
  assert.same(view.anaquote.$el[0], view.$el.children().last()[0])
  assert.hasText('????? ?????!', view.anaquote.quotation.$el)
})

test('clicking Start removes the old AnaquoteView first', () => {
  let view = new ApplicationView($('<div>'))
  view.input.$trigrams.val('HEL LOW ORL D')
  view.input.$enumeration.val('5 5!')
  view.input.$start.click()
  assert.equal(2, view.$el.children().length)

  view.input.$trigrams.val('GOO DBY E')
  view.input.$enumeration.val('4 3!')
  view.input.$start.click()
  assert.equal(2, view.$el.children().length)
})

// Can't get this to work :(
test.skip('fetchWords', () => {
  let server = sinon.fakeServer.create()

  let app = new ApplicationView($('<div>'))
  app.fetchWords()
  console.log(server)

  server.respond()
  refute.empty(server.requests)
  
  server.restore()
})
