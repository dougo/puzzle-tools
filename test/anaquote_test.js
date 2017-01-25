const { load, assert, refute, jsdom, sinon } = require('./test_helper')

load('anaquote/anaquote.js')

suite('Array utils')

test('remove', () => {
  let array = [1, 2, 3, 1]
  assert.equal([2, 3, 1], array.remove(1))
  assert.equal([1, 2, 3, 1], array)
  assert.same(array, array.remove(0))
})
test('subtract', () => {
  let array = [1, 2, 3, 1]
  assert.equal([3, 1], array.subtract([1, 2, 4]))
  assert.same(array, array.subtract([4, 5]))
})
test('sum', () => {
  assert.equal(0, [].sum())
  assert.equal(6, [1, 2, 3].sum())
})
test('uniq', () => {
  assert.equal([], [].uniq())
  assert.equal([1, 2, 3], [1, 2, 3, 1].uniq())
  assert.equal([1, 2, 3], [1, 2, 3].uniq())
})
test('flatMap', () => {
  assert.equal([2, 3, 4], [1, 2, 3].flatMap(x => x + 1))
  assert.equal([2, 3, 3, 4, 4, 5], [1, 2, 3].flatMap(x => [x + 1, x + 2]))
})

suite('String utils')

test('replaceAt', () => {
  let string = 'HELLO'
  assert.equal('YELLO', string.replaceAt(0, 'Y'))
  assert.equal('HEXXO', string.replaceAt(2, 'XX'))
  assert.equal('HELLZZ', string.replaceAt(4, 'ZZ'))
})

suite('Number utils')

test('upTo', () => {
  assert.equal([1, 2, 3], (1).upTo(3))
  assert.equal([], (3).upTo(1))
})
test('times', () => {
  assert.equal([0, 1, 2], (3).times)
  assert.equal([], (-3).times)
})

suite('Enumeration')

test('tokens', () => {
  assert.equal([3], new Enumeration('3').tokens)
  assert.equal([5, ', ', 5, '!'], new Enumeration('5, 5!').tokens)
})

test('wordLength', () => {
  assert.equal(3, new Enumeration('3').wordLength(0))
  assert.equal(5, new Enumeration('5, 6!').wordLength(0))
  assert.equal(6, new Enumeration('5, 6!').wordLength(1))
})

test('wordStart', () => {
  assert.equal(0, new Enumeration('5, 6!').wordStart(0))
  assert.equal(5, new Enumeration('5, 6!').wordStart(1))
  assert.equal(8, new Enumeration('5, 3, 6!').wordStart(2))
})

test('numWords', () => {
  assert.equal(1, new Enumeration('3').numWords)
  assert.equal(2, new Enumeration('5, 5!').numWords)
})

test('words', () => {
  assert.equal(['YAY'], new Enumeration('3').words('YAY'))
  assert.equal(['HELLO', 'WORLD'], new Enumeration('5, 5!').words('HELLOWORLD'))
})

test('word', () => {
  assert.equal('HELLO', new Enumeration('5, 5!').word(0, 'HELLOWORLD'))
  assert.equal('WORLD', new Enumeration('5, 5!').word(1, 'HELLOWORLD'))
})

test('trigramRangeForWord', () => {
  assert.equal([0], new Enumeration('3').trigramRangeForWord(0))
  assert.equal([1], new Enumeration('3 3').trigramRangeForWord(1))
  assert.equal([0, 1], new Enumeration('6').trigramRangeForWord(0))
  assert.equal([0, 1, 2], new Enumeration('7').trigramRangeForWord(0))
  assert.equal([1, 2], new Enumeration('3 5').trigramRangeForWord(1))
  assert.equal([0, 1, 2], new Enumeration('2 5').trigramRangeForWord(1))
})

test('blankString', () => {
  assert.equal('___', new Enumeration('3').blankString)
  assert.equal('_____, _____!', new Enumeration('5, 5!').blankString)
})

test('blanks', () => {
  assert.equal(['___'], new Enumeration('3').blanks)
  assert.equal(['___', '__'], new Enumeration('5').blanks)
  assert.equal([' ___', '__'], new Enumeration(' 5').blanks)
  assert.equal(['___', '__, _', '___', '_!'], new Enumeration('5, 5!').blanks)
  assert.equal(['___!'], new Enumeration('3!').blanks)
})

test('wordBlanks', () => {
  assert.equal(['_____'], new Enumeration('5').wordBlanks)
  assert.equal([' _____'], new Enumeration(' 5').wordBlanks)
  assert.equal(['_____, ', '_____!'], new Enumeration('5, 5!').wordBlanks)
})

suite('Anaquote')

test('trigrams', () => {
  assert.equal(['HEL', 'LOW', 'ORL', 'D'], new Anaquote('HEL LOW ORL D').trigrams)
})

test('enumeration', () => {
  assert.equal([], new Anaquote('').enumeration.tokens)
  assert.equal([5, ' ', 5, '!'], new Anaquote('HEL LOW ORL D', '5 5!').enumeration.tokens)
})

test('wordSet', () => {
  let model = new Anaquote('HEL LOW ORL D')
  assert.instanceOf(Set, model.wordSet)
  assert.equal(0, model.wordSet.size)

  let wordSet = new Set(['HELLO', 'WORLD'])
  model = new Anaquote('HEL LOW ORL D', '5 5!', wordSet)
  assert.same(wordSet, model.wordSet)
})

test('letters', () => {
  assert.equal('?????????D', new Anaquote('HEL LOW ORL D').letters)
})

test('selections', () => {
  assert.equal(['???', '???', '???', 'D'], new Anaquote('HEL LOW ORL D').selections)
})

test('words', () => {
  assert.equal(['?????', '????D'], new Anaquote('HEL LOW ORL D', '5 5!').words)
})

test('selection', () => {
  let model = new Anaquote('HEL LOW ORL D', '5 5!')
  assert.equal('???', model.selection(0))
  assert.equal('D', model.selection(3))
})

test('select', () => {
  let model = new Anaquote('HEL LOW ORL D', '5 5!')
  model.select(0, 'HEL')
  model.select(2, 'ORL')
  assert.equal('HEL???ORLD', model.letters)
  assert.equal(['HEL', '???', 'ORL', 'D'], model.selections)
  assert.equal(['HEL??', '?ORLD'], model.words)
})

test('isSelected', () => {
  let model = new Anaquote('HEL LOW ORL D')
  refute(model.isSelected(0))
  refute(model.isSelected(1))
  model.select(0, 'LOW')
  assert(model.isSelected(0))
  refute(model.isSelected(1))
})

test('available', () => {
  let model = new Anaquote('HEL LOW ORL D')
  assert.equal(['HEL', 'LOW', 'ORL'], model.available(0))
  assert.equal(['D'], model.available(3))

  model.select(0, 'LOW')
  assert.equal(['HEL', 'LOW', 'ORL'], model.available(0))
  assert.equal(['HEL', 'ORL'], model.available(1))

  model.select(0, 'L??')
  assert.equal(['LOW'], model.available(0))

  model = new Anaquote('TSE TSE FLY')
  assert.equal(['TSE', 'TSE', 'FLY'], model.available(2))
  model.select(0, 'TSE')
  assert.equal(['TSE', 'FLY'], model.available(2))
  model.select(1, 'TSE')
  assert.equal(['FLY'], model.available(2))
})

test('options', () => {
  let model = new Anaquote('HEL LOW ORL D')
  assert.equal(['???', 'HEL', 'LOW', 'ORL'], model.options(0))
  assert.equal(['D'], model.options(3))
})

test('options includes unselection and partial selection when trigram is partially selected', () => {
  let model = new Anaquote('HEL LOW ORL D')
  model.select(0, 'L??')
  assert.equal(['???', 'L??', 'LOW'], model.options(0))
})

test('options omits duplicates', () => {
  model = new Anaquote('TSE TSE FLY')
  assert.equal(['???', 'TSE', 'FLY'], model.options(0))
})

test('word', () => {
  let model = new Anaquote('GOO DBY E', '4 3!')
  assert.equal('????', model.word(0))
  assert.equal('??E', model.word(1))
})

test('selectWord', () => {
  let model = new Anaquote('HEL LOW ORL DGR EET ING', '5 5! 8.')
  model.selectWord(1, 'WORLD')
  assert.equal('?????WORLD????????', model.letters)
})

test('unselectedWordOption', () => {
  assert.equal('??????', new Anaquote('SEL VES', '6').unselectedWordOption(0))
})

test('unselectedWordOption includes the runt', () => {
  assert.equal('????D', new Anaquote('HEL LOW ORL D', '5 5').unselectedWordOption(1))
})

test('permuteOptions', () => {
  assert.equal([[]], Anaquote.permuteOptions([]))
  assert.equal([[1], [2]], Anaquote.permuteOptions([[1,2]]))
  assert.equal([[1,2], [2,1]], Anaquote.permuteOptions([[1,2], [1,2]]))
  assert.equal([[1,2,3], [1,2,4], [1,3,4],
                [2,3,1], [2,3,4],
                [3,2,1], [3,2,4],
                [4,2,1], [4,2,3], [4,3,1]], Anaquote.permuteOptions([[1,2,3,4], [2,3], [1,3,4]]))
})

test('optionArraysForWord includes trigrams for each slot in word range', () => {
  let model = new Anaquote('LAY OFF OUT SET', '6 6')
  assert.equal([['LAY', 'OFF', 'OUT', 'SET'], ['LAY', 'OFF', 'OUT', 'SET']], model.optionArraysForWord(0))
})

test('optionArraysForWord excludes trigrams selected elsewhere', () => {
  let model = new Anaquote('LAY OFF OUT SET', '6 6')
  model.select(2, 'LAY')
  assert.equal([['OFF', 'OUT', 'SET'], ['OFF', 'OUT', 'SET']], model.optionArraysForWord(0))
})

test('optionArraysForWord only includes selected trigrams in word range', () => {
  let model = new Anaquote('LAY OFF OUT SET', '6 6')
  model.select(0, 'LAY')
  assert.equal([['LAY'], ['OFF', 'OUT', 'SET']], model.optionArraysForWord(0))
})

test('optionArraysForWord filters partially-selected trigrams', () => {
  let model = new Anaquote('AGL ADG IRL', '1 4 4')
  model.selectWord(0, 'A')
  assert.equal([['AGL', 'ADG'], ['AGL', 'ADG', 'IRL']], model.optionArraysForWord(1))
})

test('optionArraysForWord includes all unselected-elsewhere trigrams when word is fully selected', () => {
  let model = new Anaquote('LAY OFF OUT SET', '6 6')
  model.selectWord(0, 'LAYOFF')
  model.select(2, 'OUT')
  assert.equal([['LAY', 'OFF', 'SET'], ['LAY', 'OFF', 'SET']], model.optionArraysForWord(0))
})

test('optionArraysForWord includes the runt even when word is fully selected', () => {
  let model = new Anaquote('FUN WAR D', '3 4')
  model.selectWord(1, 'WARD')
  assert.equal([['FUN', 'WAR'], ['D']], model.optionArraysForWord(1))
})

test('optionArraysForWord filters partially-selected trigrams even when word is fully selected', () => {
  let model = new Anaquote('AGL ADG IRL', '1 4 4')
  model.selectWord(0, 'A')
  model.selectWord(1, 'GLAD')
  assert.equal([['AGL', 'ADG'], ['AGL', 'ADG', 'IRL']], model.optionArraysForWord(1))
})

test('wordCandidates permutes options and forms words', () => {
  let model = new Anaquote('LAY OFF OUT SET', '6 6')
  model.selectWord(0, 'LAYOFF')
  model.select(2, 'OUT')
  assert.equal(['LAYOFF', 'LAYSET', 'OFFLAY', 'OFFSET', 'SETLAY', 'SETOFF'], model.wordCandidates(0))
})

test('wordCandidates selects the proper substrings', () => {
  let model = new Anaquote('IDI DIT', '1 3 2!')
  assert.equal(['DID', 'ITI'], model.wordCandidates(1))
})

test('wordOptions filters through wordSet and includes an unselection option', () => {
  let words = ['LAYOFF', 'LAYOUT', 'OFFSET', 'OUTLAY', 'OUTSET', 'SETOFF', 'SETOUT']
  let model = new Anaquote('LAY OFF OUT SET', '6 6', new Set(words))
  assert.equal(['??????', ...words], model.wordOptions(0))
})

test('wordOptions includes partially selected word', () => {
  model = new Anaquote('HEL LOW ORL D', '5 5!', new Set(['HELLO', 'HELOR', 'WORLD', 'WHELD', 'LLOWD']))
  model.select(1, 'LOW')
  assert.equal(['?????', '???LO', 'HELLO'], model.wordOptions(0))
  assert.equal(['????D', 'W???D', 'WHELD', 'WORLD'], model.wordOptions(1))
})

test('wordOptions includes an unselection option when a word is fully selected', () => {
  let model = new Anaquote('HEL LOW ORL D', '5 5!', new Set(['HELLO', 'HELOR', 'WORLD', 'WHELD', 'LLOWD']))
  model.selectWord(1, 'WORLD')
  assert.equal(['????D', 'LLOWD', 'WHELD', 'WORLD'], model.wordOptions(1))
})

test('wordOptions includes current word even if not in the wordSet', () => {
  let model = new Anaquote('HEL LOW ORL D', '5 5!', new Set(['HELLO']))
  model.selectWord(0, 'HELOR')
  assert.equal(['?????', 'HELLO', 'HELOR'], model.wordOptions(0))
})

test('fillInBlank', () => {
  assert.equal('HEL', Anaquote.fillInBlank('___', 'HEL'))
  assert.equal('D??', Anaquote.fillInBlank('___', 'D'))
  assert.equal('LO W', Anaquote.fillInBlank('__ _', 'LOW'))
  assert.equal('D? ?', Anaquote.fillInBlank('__ _', 'D'))
  assert.equal('D!', Anaquote.fillInBlank('_!', 'D'))
  assert.equal('H!', Anaquote.fillInBlank('_!', 'HEL'))
})

test('formatOptions', () => {
  assert.equal([['HEL', 'HE L'], ['D', 'D? ?']], Anaquote.formatOptions(['HEL', 'D'], '__ _'))
})

test('formattedOptions', () => {
  let model = new Anaquote('HEL LOW ORL D', '5 5!')
  assert.equal([['???', '?? ?'], ['HEL', 'HE L'], ['LOW', 'LO W'], ['ORL', 'OR L']],
               model.formattedOptions(1))
})

test('formattedWordOptions', () => {
  let model = new Anaquote('GOO DBY E', '4 3!', new Set(['GOOD', 'DBYG', 'OOE', 'BYE']))
  assert.equal([['????', '???? '], ['GOOD', 'GOOD '], ['DBYG', 'DBYG ']], model.formattedWordOptions(0))
  assert.equal([['??E', '??E!'], ['OOE', 'OOE!'], ['BYE', 'BYE!']], model.formattedWordOptions(1))
})

test('quotation', () => {
  let model = new Anaquote('HEL LOW ORL D', '5 5!')
  assert.equal('????? ????D!', model.quotation())
  model.select(0, 'HEL')
  model.select(1, 'LOW')
  model.select(2, 'ORL')
  assert.equal('HELLO WORLD!', model.quotation())
})

suite('SelectionView')

class TestSelectionView extends SelectionView {
  modelOptions(i) { return [['?', '?'], [`${i}`, `${i},  `]] }
  modelValue(i) { return this.value || `${i}` }
  modelSelect(i, value) { this.value = value }
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

test('render', () => {
  let view = new TestSelectionView(new Anaquote('HEL LOW ORL D'), 0)
  assert.equal(view, view.render())
  assert.equal(['?', '0'], view.$options.map(o => o.value))
  assert.equal('0,&nbsp;&nbsp;', view.$options[1].text)
  assert.hasValue('0', view.$el)

  view.render()
  assert.equal(['?', '0'], view.$options.map(o => o.value))
})

test('selecting an option updates the model', () => {
  let view = new TestSelectionView(new Anaquote('HEL LOW ORL D'), 0)
  let $el = view.render().$el
  $el.val('?').change()
  assert.equal('?', view.modelValue(0))
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
  assert.equal('0', view.subviews[0].$options[1].value)
  assert.equal('1', view.subviews[1].$options[1].value)
})

suite('TrigramSelectionView')

test('extends SelectionView', () => {
  let view = new TrigramSelectionView(new Anaquote('HEL LOW ORL D', '5 5!'), 1)
  assert.instanceOf(SelectionView, view)
  assert.equal(view.model.formattedOptions(1), view.modelOptions(1))
  assert.equal('???', view.modelValue(1))
  view.modelSelect(1, 'HEL')
  assert.equal('HEL', view.modelValue(1))
})

suite('WordSelectionView')

test('extends SelectionView', () => {
  let view = new WordSelectionView(new Anaquote('HEL LOW ORL D', '5 5!', new Set(['HELLO'])), 0)
  assert.instanceOf(SelectionView, view)
  assert.equal(view.model.formattedWordOptions(1), view.modelOptions(1))
  assert.equal('?????', view.modelValue(0))
  view.modelSelect(0, 'HELLO')
  assert.equal('HELLO', view.modelValue(0))
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
  assert.equal(model.words, view.selections())
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
  assert.hasText(view.model.quotation(), view.$el)
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
  assert.hasText(view.model.quotation(), view.quotation.$el)
})

test('selecting an option re-renders', () => {
  let view = new AnaquoteView(new Anaquote('HEL LOW ORL D', '5 5!')).render()
  view.trigrams.subviews[1].$el.val('LOW').change()
  refute.includes(view.trigrams.subviews[0].$options.map(o => o.value), 'LOW')
  assert.hasText(view.model.quotation(), view.quotation.$el)
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
  assert.equal([5, ' ', 5, '!'], anaquote.enumeration.tokens)
  assert.instanceOf(Set, anaquote.wordSet)
  let wordSet = new Set(['HELLO', 'WORLD'])
  assert.same(wordSet, view.newAnaquote(wordSet).wordSet)
})

suite('ApplicationView')

test('constructor', () => {
  let $el = $('<div>')
  let view = new ApplicationView($el)
  assert.same($el, view.$el)
  assert.instanceOf(InputView, view.input)
  assert.same(view.input.$el[0], view.$el.children()[0])
})

test('clicking Start makes a new rendered AnaquoteView', () => {
  let view = new ApplicationView($('<div>'))
  view.input.$trigrams.val('HEL LOW ORL D')
  view.input.$enumeration.val('5 5!')
  view.input.$start.click()
  assert.instanceOf(AnaquoteView, view.anaquote)
  assert.equal(['HEL', 'LOW', 'ORL', 'D'], view.anaquote.model.trigrams)
  assert.equal([5, ' ', 5, '!'], view.anaquote.model.enumeration.tokens)
  assert.same(view.anaquote.$el[0], view.$el.children().last()[0])
  assert.hasText(view.anaquote.model.quotation(), view.anaquote.quotation.$el)
  assert.instanceOf(Set, view.anaquote.model.wordSet)

  view.words = new Set(['HELLO', 'WORLD'])
  view.input.$start.click()
  assert.same(view.words, view.anaquote.model.wordSet)
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
