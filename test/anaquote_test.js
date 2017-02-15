const { load, assert, refute, jsdom, sinon } = require('./test_helper')

load('anaquote/anaquote.js')

suite('Array utils')

test('first', () => {
  assert.equal(undefined, [].first())
  assert.equal(1, [1].first())
  assert.equal(1, [1, 2, 3].first())
})
test('last', () => {
  assert.equal(undefined, [].last())
  assert.equal(1, [1].last())
  assert.equal(3, [1, 2, 3].last())
})
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
  assert.equal(12, [1, 2, 3].sum(x => x * 2))
})
test('squeeze', () => {
  assert.equal([], [].squeeze())
  assert.equal([1], [1].squeeze())
  assert.equal([1, 2, 3], [1, 1, 2, 2, 3].squeeze())
  assert.equal([1, 2, 3, 1], [1, 2, 3, 1].squeeze())
})
test('flatMap', () => {
  assert.equal([2, 3, 4], [1, 2, 3].flatMap(x => x + 1))
  assert.equal([2, 3, 3, 4, 4, 5], [1, 2, 3].flatMap(x => [x + 1, x + 2]))
})
test('productWithoutRepeats', () => {
  assert.equal([[]], [].productWithoutRepeats())
  assert.equal([[1], [2]], [[1,2]].productWithoutRepeats())
  assert.equal([[1,2], [2,1]], [[1,2], [1,2]].productWithoutRepeats())
  assert.equal([[1,2,3], [1,2,4], [1,3,4],
                [2,3,1], [2,3,4],
                [3,2,1], [3,2,4],
                [4,2,1], [4,2,3], [4,3,1]], [[1,2,3,4], [2,3], [1,3,4]].productWithoutRepeats())
})
test('productWithoutRepeats with checkPrefix function', () => {
  function isSorted(array) { return array.length < 2 || array[0] <= array[1] && isSorted(array.slice(1)) }
  assert.equal([[1,2,3], [1,2,4], [1,3,4], [2,3,4]], [[1,2,3,4], [2,3], [1,3,4]].productWithoutRepeats(isSorted))
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

suite('WordSet')

test('is a Set', () => {
  let wordSet = new WordSet()
  assert.instanceOf(Set, wordSet)
})

test('hasPrefix', () => {
  let wordSet = new WordSet(['IT'])
  assert(wordSet.hasPrefix('IT', 2))
  assert(wordSet.hasPrefix('I', 2))
  assert(wordSet.hasPrefix('', 2))
  refute(wordSet.hasPrefix('T', 2))
  refute(wordSet.hasPrefix('I', 3))
  refute(wordSet.hasPrefix('I', 1))
})

suite('Blank')

test('toString', () => {
  assert.equal('foo', new Blank('foo'))
})

test('length', () => {
  assert.equal(3, new Blank('3').length)
  assert.equal(5, new Blank(' 5, ').length)
  assert.equal(4, new Blank("3'1").length)
  assert.equal(0, new Blank('...').length)
})

test('formattedLength', () => {
  assert.equal(3, new Blank('3').formattedLength)
  assert.equal(5, new Blank(' 5, ').formattedLength)
  assert.equal(5, new Blank("3'1").formattedLength)
  assert.equal(0, new Blank('...').formattedLength)
})

test('trigramBlanks', () => {
  assert.instanceOf(Blank, new Blank('3').trigramBlanks()[0])
  assert.equal(['3'], new Blank('3').trigramBlanks())
  assert.equal(['3', '2'], new Blank('5').trigramBlanks())
  assert.equal(['*3', '2'], new Blank('*5').trigramBlanks())
  assert.equal(['3', '2, 1', '3', '1!'], new Blank('5, 5!').trigramBlanks())
  assert.equal(['3!'], new Blank('3!').trigramBlanks())
  assert.equal(['3-', '3'], new Blank('3-3').trigramBlanks())
})

test('prefix', () => {
  assert.equal('', new Blank('3').prefix)
  assert.equal(' (', new Blank(' (3/2)').prefix)
})

test('suffix', () => {
  assert.equal('', new Blank('3').suffix)
  assert.equal('! ', new Blank(' 5! ').suffix)
})

test('sanitize', () => {
  assert.instanceOf(Blank, new Blank('3').sanitize())
  assert.equal('3', new Blank('3').sanitize())
  assert.equal("3'1", new Blank('3’1').sanitize())
})

test('fillIn', () => {
  assert.equal('HELLO', new Blank('5').fillIn('HELLO'))
  assert.equal('AND/OR', new Blank('(3/2)').fillIn('ANDOR'))
})

test('fillIn with prefix', () => {
  let blank = new Blank('2-3')
  assert.equal('', blank.fillIn(''))
  assert.equal('A', blank.fillIn('A'))
  assert.equal('AD-', blank.fillIn('AD'))
  assert.equal('AD-H', blank.fillIn('ADH'))
  assert.equal('AD-HOC', blank.fillIn('ADHOC'))
})

test('formatOptions', () => {
  assert.equal([['HEL', 'HE L'], ['LOW', 'LO W']], new Blank('2 1').formatOptions(['HEL', 'LOW']))
})

suite('Enumeration')

test('toString', () => {
  assert.equal('5, 5!', new Enumeration('5, 5!'))
})

test('length', () => {
  assert.equal(9, new Enumeration("1 3'1 4.").length)
})

test('blank', () => {
  let enumeration = new Enumeration('5, 5!')
  assert.instanceOf(Blank, enumeration.blank)
  assert.equal('5, 5!', enumeration.blank)
})

test('trigramBlanks', () => {
  assert.instanceOf(Blank, new Enumeration('3').trigramBlanks[0])
  assert.equal(['3', '2, 1', '3', '1!'], new Enumeration('5, 5!').trigramBlanks)
})

test('wordBlanks', () => {
  let blanks = new Enumeration("  3'1  ...\t5 ").wordBlanks
  assert.instanceOf(Blank, blanks[0])
  assert.equal(["3'1  ", '...\t5'], blanks)
})

test('wordStart', () => {
  assert.equal(0, new Enumeration('5, 6!').wordStart(0))
  assert.equal(5, new Enumeration('5, 6!').wordStart(1))
  assert.equal(8, new Enumeration('5, 3, 6!').wordStart(2))
  assert.equal(5, new Enumeration("1 3'1 4.").wordStart(2))
})

suite('Quotation')

test('toString', () => {
  assert.equal('???', new Quotation('???'))
})

test('value', () => {
  assert.equal('???', new Quotation('???').value)
})

test('formattedValue', () => {
  assert.equal('HELLOWORLD', new Quotation('HELLOWORLD').formattedValue)
  assert.equal('HELLO, WORLD!', new Quotation('HELLOWORLD', [], new Enumeration('5, 5!')).formattedValue)
})

test('trigrams', () => {
  assert.equal([], new Quotation('', []).trigrams)
  assert.equal(['HOO', 'RAY'], new Quotation('??????', ['HOO', 'RAY']).trigrams)
})

test('enumeration', () => {
  let e = new Enumeration('6')
  assert.same(e, new Quotation('??????', ['HOO', 'RAY'], e).enumeration)
})

test('enumeration default', () => {
  let enumeration = new Quotation('??????', ['HOO', 'RAY']).enumeration
  assert.instanceOf(Enumeration, enumeration)
  assert.equal('6', enumeration)
})

test('leftover', () => {
  assert.equal('', new Quotation('YAY').leftover)
  assert.equal('LO', new Quotation('HELLO').leftover)
})

test('setting value unselects partial trigrams that now have no available matches', () => {
  let model = new Quotation('S?????', ['SEL', 'VES'])
  model.value = 'S??SEL'
  assert.equal('???SEL', model.value)
})

test('selectedTrigrams', () => {
  let model = new Quotation('?????????D')
  assert.equal(['???', '???', '???'], model.selectedTrigrams)
  model.value = 'HELLOWORLD'
  assert.equal(['HEL', 'LOW', 'ORL'], model.selectedTrigrams)
})

test('trigramSelect', () => {
  let trigrams = ['HOO', 'RAY']
  let enumeration = new Enumeration('6!')
  let model = new Quotation('HOORAY', trigrams, enumeration)
  let trigramSelect = model.trigramSelect(1)
  assert.same(trigrams, trigramSelect.trigrams)
  assert.same(model, trigramSelect.quotation)
  assert.equal(3, trigramSelect.i)
  assert.same(enumeration.trigramBlanks[1], trigramSelect.blank)
})

suite('TrigramSelect')

test('trigrams', () => {
  assert.equal(['HEL', 'LOW', 'ORL'], new TrigramSelect(['HEL', 'LOW', 'ORL']).trigrams)
})

test('quotation', () => {
  let q = new Quotation('YAY')
  assert.same(q, new TrigramSelect([], q).quotation)
})

test('i', () => {
  assert.equal(42, new TrigramSelect([], null, 42).i)
})

test('blank', () => {
  let b = new Blank('2 1')
  assert.same(b, new TrigramSelect([], null, 0, b).blank)
})

test('blank default', () => {
  let blank = new TrigramSelect([], null, 0).blank
  assert.instanceOf(Blank, blank)
  assert.equal('3', blank)
})

test('value', () => {
  assert.equal('LOW', new TrigramSelect([], new Quotation('HELLOWORLD'), 3).value)
})


test('isUnselected', () => {
  assert(new TrigramSelect([], new Quotation('HEL???ORLD'), 3).isUnselected)
  refute(new TrigramSelect([], new Quotation('HELL??ORLD'), 3).isUnselected)
  refute(new TrigramSelect([], new Quotation('HELLOWORLD'), 3).isUnselected)
})
test('isPartiallySelected', () => {
  refute(new TrigramSelect([], new Quotation('HEL???ORLD'), 3).isPartiallySelected)
  assert(new TrigramSelect([], new Quotation('HELL??ORLD'), 3).isPartiallySelected)
  refute(new TrigramSelect([], new Quotation('HELLOWORLD'), 3).isPartiallySelected)
})
test('isFullySelected', () => {
  refute(new TrigramSelect([], new Quotation('HEL???ORLD'), 3).isFullySelected)
  refute(new TrigramSelect([], new Quotation('HELL??ORLD'), 3).isFullySelected)
  assert(new TrigramSelect([], new Quotation('HELLOWORLD'), 3).isFullySelected)
})

test('select', () => {
  let q = new Quotation('HEL???ORLD')
  let model = new TrigramSelect([], q, 3)
  model.select('LOW')
  assert.equal('HELLOWORLD', q.value)
})

test('available', () => {
  let model = new TrigramSelect(['HEL', 'LOW', 'ORL'], new Quotation('?????????D'), 3)
  assert.equal(['HEL', 'LOW', 'ORL'], model.available())
})

test('available when selected', () => {
  let q = new Quotation('LOW??????D')
  let model = new TrigramSelect(['HEL', 'LOW', 'ORL'], q, 0)
  let otherModel = new TrigramSelect(['HEL', 'LOW', 'ORL'], q, 3)
  assert.equal(['HEL', 'LOW', 'ORL'], model.available())
  assert.equal(['HEL', 'ORL'], otherModel.available())
})

test('available filters if partially selected', () => {
  let model = new TrigramSelect(['HEL', 'LOW', 'ORL'], new Quotation('HELLOWORLD'), 3)
  model.select('L??')
  assert.equal(['LOW'], model.available())
})

test('available includes duplicates', () => {
  let q = new Quotation('?????????')
  let model = new TrigramSelect(['FLY', 'TSE', 'TSE'], q, 6)
  assert.equal(['FLY', 'TSE', 'TSE'], model.available())
  q.value = 'TSE??????'
  assert.equal(['FLY', 'TSE'], model.available())
  q.value = 'TSETSE???'
  assert.equal(['FLY'], model.available())
})

test('options', () => {
  let q = new Quotation('?????????D')
  let model = new TrigramSelect(['HEL', 'LOW', 'ORL'], q, 0)
  assert.equal(['???', 'HEL', 'LOW', 'ORL'], model.options())
})

test('options includes unselection and partial selection when trigram is partially selected', () => {
  let q = new Quotation('???L?????D')
  let model = new TrigramSelect(['HEL', 'LOW', 'ORL'], q, 3)
  assert.equal(['???', 'L??', 'LOW'], model.options())
})

test('options omits duplicates', () => {
  let q = new Quotation('?????????')
  let model = new TrigramSelect(['FLY', 'TSE', 'TSE'], q, 0)
  assert.equal(['???', 'FLY', 'TSE'], model.options())
})

test('formattedOptions', () => {
  let q = new Quotation('?????????D')
  let model = new TrigramSelect(['HEL', 'LOW', 'ORL'], q, 3, new Blank('2 1'))
  assert.equal([['???', '?? ?'], ['HEL', 'HE L'], ['LOW', 'LO W'], ['ORL', 'OR L']], model.formattedOptions())
})

suite('WordSelect')

test('quotation', () => {
  let q = new Quotation('??????')
  assert.same(q, new WordSelect(q, 42, new Blank('17')).quotation)
})

test('offset', () => {
  assert.equal(42, new WordSelect(null, 42, new Blank('17')).offset)
})

test('blank', () => {
  let blank = new Blank("3'1")
  assert.same(blank, new WordSelect(null, 0, blank).blank)
})

test('length', () => {
  assert.equal(17, new WordSelect(null, 42, new Blank('17')).length)
})

test('lookupBlank', () => {
  let blank = new WordSelect(null, 0, new Blank('3’1')).lookupBlank
  assert.instanceOf(Blank, blank)
  assert.equal("3'1", blank)
})

test('wordSet', () => {
  let wordSet = new WordSet(['HELLO'])
  assert.same(wordSet, new WordSelect(null, 0, new Blank('3'), wordSet).wordSet)
})

test('value', () => {
  let q = new Quotation('??????E')
  assert.equal('????', new WordSelect(q, 0, new Blank('4')).value)
  assert.equal('??E', new WordSelect(q, 4, new Blank('3')).value)
})

test('select', () => {
  let q = new Quotation('???LO')
  let model = new WordSelect(q, 0, new Blank('5'))
  model.select('HELLO')
  assert.equal('HELLO', q.value)
})

test('select partially selects trigrams on the border that have multiple candidates', () => {
  let q = new Quotation('???????????????', ['HEL', 'LOW', 'ORL', 'DWI', 'DOW'])
  let model = new WordSelect(q, 5, new Blank('5'))
  model.select('WORLD')
  assert.equal('?????WORLD?????', q.value)
})

test('select fully selects partial trigrams if they have only one unique candidate', () => {
  let q = new Quotation('?????????????????????', ['HEL', 'LOW', 'ORL', 'DGR', 'OUN', 'DGR', 'UEL'])
  let model = new WordSelect(q, 5, new Blank('5'))
  model.select('WORLD')
  assert.equal('???LOWORLDGR?????????', q.value)
})

test('select does not fully select partial trigrams if unselecting', () => {
  let q = new Quotation('???LOW???D', ['HEL', 'LOW', 'ORL'])
  let model = new WordSelect(q, 0, new Blank('5'))
  model.select('?????')
  assert.equal('?????W???D', q.value)
})

test('unselectOption', () => {
  let q = new Quotation('SELVES')
  assert.equal('??????', new WordSelect(q, 0, new Blank('6')).unselectOption())
})

test('unselectOption includes the leftover', () => {
  let q = new Quotation('HELLOWORLD')
  assert.equal('????D', new WordSelect(q, 5, new Blank('5')).unselectOption())
})

test('trigramRange', () => {
  assert.equal([0, 0], new WordSelect(null, 0, new Blank('3')).trigramRange())
  assert.equal([1, 1], new WordSelect(null, 3, new Blank('3')).trigramRange())
  assert.equal([0, 1], new WordSelect(null, 0, new Blank('6')).trigramRange())
  assert.equal([0, 2], new WordSelect(null, 0, new Blank('7')).trigramRange())
  assert.equal([1, 2], new WordSelect(null, 3, new Blank('5')).trigramRange())
  assert.equal([0, 2], new WordSelect(null, 2, new Blank('5')).trigramRange())
})

test('trigramOptionArrays includes trigrams for each slot in word range', () => {
  let q = new Quotation('????????????', ['LAY', 'OFF', 'OUT', 'SET'])
  let model = new WordSelect(q, 0, new Blank('6'))
  assert.equal([['LAY', 'OFF', 'OUT', 'SET'], ['LAY', 'OFF', 'OUT', 'SET']], model.trigramOptionArrays())
})

test('trigramOptionArrays excludes trigrams selected elsewhere', () => {
  let q = new Quotation('??????LAY???', ['LAY', 'OFF', 'OUT', 'SET'])
  let model = new WordSelect(q, 0, new Blank('6'))
  assert.equal([['OFF', 'OUT', 'SET'], ['OFF', 'OUT', 'SET']], model.trigramOptionArrays())
})

test('trigramOptionArrays only includes selected trigrams in word range', () => {
  let q = new Quotation('LAY?????????', ['LAY', 'OFF', 'OUT', 'SET'])
  let model = new WordSelect(q, 0, new Blank('6'))
  assert.equal([['LAY'], ['OFF', 'OUT', 'SET']], model.trigramOptionArrays())
})

test('trigramOptionArrays filters partially-selected trigrams', () => {
  let q = new Quotation('A????????', ['ADG', 'AGL', 'IRL'])
  let model = new WordSelect(q, 1, new Blank('4'))
  assert.equal([['ADG', 'AGL'], ['ADG', 'AGL', 'IRL']], model.trigramOptionArrays())
})

test('trigramOptionArrays includes all unselected-elsewhere trigrams when word is fully selected', () => {
  let q = new Quotation('LAYOFFOUT???', ['LAY', 'OFF', 'OUT', 'SET'])
  let model = new WordSelect(q, 0, new Blank('6'))
  assert.equal([['LAY', 'OFF', 'SET'], ['LAY', 'OFF', 'SET']], model.trigramOptionArrays())
})

test('trigramOptionArrays includes the leftover', () => {
  let q = new Quotation('??????D', ['FUN', 'WAR'])
  let model = new WordSelect(q, 3, new Blank('4'))
  assert.equal([['FUN', 'WAR'], ['D']], model.trigramOptionArrays())
})

test('candidates permutes options, prunes non-prefixes, and returns words', () => {
  let q = new Quotation('LAYOFFOUT???', ['LAY', 'OFF', 'OUT', 'SET'])
  let model = new WordSelect(q, 0, new Blank('6'), new WordSet(['LAYOFF', 'OFFLAY', 'OFFSET', 'SETOFF']))
  assert.equal(['LAYOFF', 'OFFLAY', 'OFFSET', 'SETOFF'], model.candidates())
})

test('candidates selects the proper substrings', () => {
  let q = new Quotation('??????', ['DIT', 'IDI'])
  let model = new WordSelect(q, 1, new Blank('3'), new WordSet(['ITI', 'DID']))
  assert.equal(['ITI', 'DID'], model.candidates())
})

test('candidates includes apostrophes, hyphens, and slashes when looking up words', () => {
  let wordSet = new WordSet(['AND/OR', "CAN'T", 'CATCH-22', "L'OEIL", 'RANT'])
  let q = new Quotation('?????????????????????', ['CAT', 'CH2', '2AN', 'DOR', 'LOE', 'ILC', 'ANT'])
  assert.equal(['CATCH22'], new WordSelect(q, 0, new Blank('5-2'), wordSet).candidates())
  assert.equal(['ANDOR'], new WordSelect(q, 7, new Blank('(3/2)'), wordSet).candidates())
  assert.equal(['LOEIL',], new WordSelect(q, 12, new Blank("1'4"), wordSet).candidates())
  assert.equal(['CANT'], new WordSelect(q, 17, new Blank('3’1'), wordSet).candidates())
})

test('options filters through wordSet and includes an unselection option', () => {
  let q = new Quotation('??????', ['LAY', 'OFF', 'OUT', 'SET'])
  let words = ['LAYOFF', 'LAYOUT', 'OFFSET', 'OUTLAY', 'OUTSET', 'SETOFF', 'SETOUT']
  let model = new WordSelect(q, 0, new Blank('6'), new WordSet(words))
  assert.equal(['??????', ...words], model.options())
})

test('options includes partially selected word', () => {
  let q = new Quotation('???LOW???D', ['HEL', 'LOW', 'ORL'])
  let wordSet = new WordSet(['HELLO', 'HELOR', 'WORLD', 'WHELD', 'LLOWD'])
  assert.equal(['?????', '???LO', 'HELLO'], new WordSelect(q, 0, new Blank('5'), wordSet).options())
  assert.equal(['????D', 'W???D', 'WHELD', 'WORLD'], new WordSelect(q, 5, new Blank('5'), wordSet).options())
})

test('options includes an unselection option when a word is fully selected', () => {
  let q = new Quotation('?????WORLD', ['HEL', 'LOW', 'ORL'])
  assert.equal(['????D', 'WORLD'], new WordSelect(q, 5, new Blank('5'), new WordSet(['WORLD'])).options())
})

test('options includes current word even if not in the wordSet', () => {
  let q = new Quotation('VESSEL', ['SEL', 'VES'])
  let model = new WordSelect(q, 0, new Blank('6'), new WordSet(['SELVES']))
  assert.equal(['??????', 'SELVES', 'VESSEL'], model.options())
})

test('options is sorted', () => {
  let q = new Quotation('??????', ['AST', 'IFE'])
  let model = new WordSelect(q, 1, new Blank('5'), new WordSet(['A', 'FEAST', 'I', 'STIFE']))
  assert.equal(['?????', 'FEAST', 'STIFE'], model.options())
})

test('formattedOptions', () => {
  let q = new Quotation('??????OP', ['CAN', 'TST'])
  let wordSet = new WordSet(["CAN'T", 'STOP'])
  let models = [new WordSelect(q, 0, new Blank('3’1'), wordSet),
                new WordSelect(q, 4, new Blank('4!'), wordSet)]
  assert.equal([['????', '???’?'], ['CANT', 'CAN’T']], models[0].formattedOptions())
  assert.equal([['??OP', '??OP'],  ['STOP', 'STOP']],  models[1].formattedOptions())
})

suite('Anaquote')

test('error if total length of trigrams differs from enumeration', () => {
  let ex = assert.throws(Error, () => new Anaquote('HEL LOW ORL D', '5, 6!'))
  assert.equal('Enumeration is too long!', ex.message)

  ex = assert.throws(Error, () => new Anaquote('HEL LOW ORL D', '5, 4!'))
  assert.equal('Enumeration is too short!', ex.message)
})
test('error if trigrams are longer than 3', () => {
  let ex = assert.throws(Error, () => new Anaquote('HEL LOW ORLD'))
  assert.equal('Not a trigram: ORLD', ex.message)
})
test('error if more than one leftover', () => {
  let ex = assert.throws(Error, () => new Anaquote('HEL LOW OR LD'))
  assert.equal('More than one leftover: OR LD', ex.message)
})

test('trigrams is an array', () => {
  assert.equal(['HEL', 'LOW', 'ORL'], new Anaquote('HEL LOW ORL D').trigrams)
})
test('trigrams is uppercase', () => {
  assert.equal(['HEL', 'LOW', 'ORL'], new Anaquote('hel low orl d').trigrams)
})
test('trigrams is sorted', () => {
  assert.equal(['DBY', 'GOO'], new Anaquote('GOO DBY E').trigrams)
})
test('trigrams omits extra spaces', () => {
  assert.equal(['HEL', 'LOW', 'ORL'], new Anaquote(' HEL  LOW   ORL D  ').trigrams)
})

test('enumeration', () => {
  assert.equal('5 5!', new Anaquote('HEL LOW ORL D', '5 5!').enumeration)
  assert.equal(undefined, new Anaquote('EXT RAV AGA NZA').enumeration)
})

test('wordSet', () => {
  let model = new Anaquote('HEL LOW ORL D')
  assert.instanceOf(WordSet, model.wordSet)
  assert.equal(0, model.wordSet.size)

  let wordSet = new WordSet(['HELLO', 'WORLD'])
  model = new Anaquote('HEL LOW ORL D', '5 5!', wordSet)
  assert.same(wordSet, model.wordSet)
})

test('quotation', () => {
  let model = new Anaquote('HEL LOW ORL D')
  assert.instanceOf(Quotation, model.quotation)
  assert.equal('?????????D', model.quotation.value)
  assert.equal(['HEL', 'LOW', 'ORL'], model.quotation.trigrams)
  assert.equal('10', model.quotation.enumeration)
})

test('quotation with enumeration', () => {
  let model = new Anaquote('HEL LOW ORL D', '5, 5!')
  assert.same(model.enumeration, model.quotation.enumeration)
})

test('trigramSelects', () => {
  let model = new Anaquote('HOO RAY')
  let selects = model.trigramSelects
  assert.equal(2, selects.length)
  assert.equal(model.quotation.trigramSelect(0), selects[0])
  assert.equal(model.quotation.trigramSelect(1), selects[1])
})

test('trigramSelects with blanks', () => {
  let selects = new Anaquote('FUN IAM', '1 2 3!').trigramSelects
  assert.equal('1 2 ', selects[0].blank)
  assert.equal('3!', selects[1].blank)
})

test('trigramSelects includes leftover into last blank', () => {
  let selects = new Anaquote('JEL LO').trigramSelects
  assert.equal('3LO', selects.last().blank)
})

test('trigramSelects includes formatted leftover into last blank', () => {
  let selects = new Anaquote('JEL LO', '4-1!').trigramSelects
  assert.equal('3L-O!', selects.last().blank)
})

test('wordSelects', () => {
  let model = new Anaquote('GOO DBY E', '4 3!', new WordSet(['GOOD', 'BYE']))
  let selects = model.wordSelects
  assert.equal(2, selects.length)
  assert.instanceOf(WordSelect, selects[0])
  assert.same(model.quotation, selects[0].quotation)
  assert.equal(0, selects[0].offset)
  assert.equal(4, selects[0].length)
  assert.equal(4, selects[1].offset)
  assert.equal(3, selects[1].length)
  assert.same(model.wordSet, selects[0].wordSet)
  assert.same(model.enumeration.wordBlanks[0], selects[0].blank)
})

suite('SelectView')

class TestSelect {
  constructor (i) {
    this.i = i
    this.value = `${this.i}`
    this.blank = this.value.length.toString()
  }
  formattedOptions() { return [['?', '?'], [`${this.i}`, `*${this.i},  `]] }
  select(value) { this.value = value }
}

test('model', () => {
  let model = new TestSelect(0)
  assert.same(model, new SelectView(model).model)
})

test('$el', () => {
  let $el = new SelectView(new TestSelect(0)).$el
  assert.is('span', $el)
  assert.equal(1, $el.contents().length)
})

test('$el includes prefix and suffix if select has a blank', () => {
  let model = new TestSelect(0)
  model.blank = new Blank('*1,  ')
  let $el = new SelectView(model).$el
  assert.equal(3, $el.contents().length)
  assert.equal('*', $el.contents().eq(0).text())
  assert.equal(',  ', $el.contents().eq(2).text())
})

test('$select', () => {
  let view = new SelectView(new TestSelect(0))
  assert.is('select', view.$select)
  assert.same(view.$el[0], view.$select.parent()[0])
  assert.empty(view.$select.children())
})

test('$options', () => {
  let view = new SelectView(new TestSelect(0))
  assert.empty(view.$options)
  view.$select.append('<option>foo</option>', '<option>bar</option>')
  assert.equal(['foo', 'bar'], view.$options.map(o => o.value))
})

test('render', () => {
  let view = new SelectView(new TestSelect(0))
  assert.same(view, view.render())
  assert.equal(['?', '0'], view.$options.map(o => o.value))
  assert.equal('*0,&nbsp;&nbsp;', view.$options[1].text)
  assert.hasValue('0', view.$select)
})

test('re-render empties the options first', () => {
  let view = new SelectView(new TestSelect(0))
  view.render().render()
  assert.equal(['?', '0'], view.$options.map(o => o.value))
})

test('selecting an option updates the model', () => {
  let view = new SelectView(new TestSelect(0))
  view.render().$select.val('?').change()
  assert.equal('?', view.model.value)
})

suite('SelectsView')

test('constructor', () => {
  let selects = [0,1,2,3].map(i => new TestSelect(i))
  let view = new SelectsView(selects)
  assert.is('p', view.$el)
  assert.hasClass('mono', view.$el)
  assert.equal(selects, view.subviews.map(v => v.model))
  assert.equal(4, view.subviews.length)

  let subview = view.subviews[0]
  assert.instanceOf(SelectView, subview)
  assert.same(selects[0], subview.model)

  assert.equal(4, view.$el.children().length)
  assert.same(subview.$el[0], view.$el.children()[0])
})

test('render renders subviews', () => {
  let view = new SelectsView([0,1,2,3].map(i => new TestSelect(i)))
  assert.same(view, view.render())
  assert.equal('0', view.subviews[0].$options[1].value)
  assert.equal('1', view.subviews[1].$options[1].value)
})

suite('QuotationView')

test('constructor', () => {
  let model = new Quotation('HELLOWORLD')
  let view = new QuotationView(model)
  assert.same(model, view.model)
  assert.is('p', view.$el)
})

test('render', () => {
  let view = new QuotationView(new Quotation('HELLOWORLD', [], new Enumeration('5 5!')))
  assert.same(view, view.render())
  assert.hasText(view.model.formattedValue, view.$el)
})

suite('AnaquoteView')

test('constructor', () => {
  let model = new Anaquote('HEL LOW ORL D', '5 5!')
  let view = new AnaquoteView(model)
  assert.is('div', view.$el)
  assert.same(model, view.model)

  assert.instanceOf(QuotationView, view.quotation)
  assert.same(model.quotation, view.quotation.model)
  assert.same(view.quotation.$el[0], view.$el.children()[0])

  assert.instanceOf(SelectsView, view.trigrams)
  assert.equal(model.trigramSelects, view.trigrams.subviews.map(v => v.model))
  assert.same(view.trigrams.$el[0], view.$el.children()[1])

  assert.instanceOf(SelectsView, view.words)
  assert.equal(model.wordSelects, view.words.subviews.map(v => v.model))
  assert.same(view.words.$el[0], view.$el.children()[2])
})

test('render', () => {
  let view = new AnaquoteView(new Anaquote('HEL LOW ORL D', '5 5!'))
  assert.same(view, view.render())
  refute.empty(view.trigrams.subviews[0].$options)
  refute.empty(view.words.subviews[0].$options)
  assert.hasText('????? ????D!', view.quotation.$el)
})

test('selecting an option re-renders', () => {
  let view = new AnaquoteView(new Anaquote('HEL LOW ORL D', '5 5!')).render()
  view.trigrams.subviews[1].$select.val('LOW').change()
  refute.includes(view.trigrams.subviews[0].$options.map(o => o.value), 'LOW')
  assert.hasText('???LO W???D!', view.quotation.$el)
})

test('omits words view when enumeration is blank', () => {
  let view = new AnaquoteView(new Anaquote('EXT RAV AGA NZA'))
  assert.equal(undefined, view.words)
  assert.equal(2, view.$el.children().length)
  view.render()
})

suite('InputView')

test('constructor', () => {
  let url = window.location.href
  jsdom.changeURL(window, url + '?trigrams=HEL+LOW+ORL+D&enumeration=5+5!')
  let view = new InputView()
  jsdom.changeURL(window, url)
  assert.is('form', view.$el)
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

  assert.is('button[type=submit]', view.$start)
  assert.hasText('Start', view.$start)
  assert.hasProp('disabled', false, view.$start)
})

test('button is disabled if trigrams param is blank', () => {
  let view = new InputView()
  assert.hasProp('disabled', true, view.$start)
})

test('button is enabled/disabled when trigrams input changes', () => {
  let view = new InputView()
  view.$trigrams.val('X').change()
  assert.hasProp('disabled', false, view.$start)

  view.$trigrams.val('').change()
  assert.hasProp('disabled', true, view.$start)
})

test('submitting the form calls the callback with trigrams and enumeration', () => {
  let trigrams, enumeration
  let view = new InputView((t, e) => { trigrams = t; enumeration = e })
  view.$trigrams.val('HEL LOW ORL D')
  view.$enumeration.val('5 5!')
  view.$el.submit()
  assert.equal('HEL LOW ORL D', trigrams)
  assert.equal('5 5!', enumeration)
})

test('submit form causes blur', () => {
  let view = new InputView()
  view.$trigrams.val('HEL LOW ORL D')
  view.$enumeration.val('5 5!')
  view.$enumeration.focus()
  assert(document.hasFocus())
  view.$el.submit()
  refute(document.hasFocus())
})

test('setMessage displays a message at the bottom of the form', () => {
  let view = new InputView()
  view.setMessage('frobnicating...')
  assert.hasClass('message', view.$message)
  assert.hasText('frobnicating...', view.$message)
  let $children = view.$el.children('div')
  assert.equal(4, $children.length)
  assert.same(view.$message[0], $children.eq(3)[0])
})

test('setMessage with className argument', () => {
  let view = new InputView()
  view.setMessage('whoopsie.', 'error')
  assert.hasClass('error', view.$message)
})

test('setMessage replaces the previous message', () => {
  let view = new InputView()
  view.setMessage('synchronizing cardinal grammeters...')
  view.setMessage('oscillating quasistatic regeneration...')
  assert.equal(4, view.$el.children('div').length)
})

test('clearMessage removes the message from the form', () => {
  let view = new InputView()
  view.setMessage('reducing sinusoidal depleneration...')
  view.clearMessage()
  assert.equal(3, view.$el.children('div').length)
  assert.equal(undefined, view.$message)
})

test('clearMessage with no message', () => {
  let view = new InputView()
  view.clearMessage()
  assert.equal(3, view.$el.children('div').length)
})

test('error thrown by callback is displayed on the form', () => {
  let view = new InputView(() => { throw new Error('oops') })
  view.$enumeration.focus()
  view.$el.submit()
  assert(document.hasFocus())
  assert.hasText('oops', view.$message)
})

test('old error message is cleared when no error is thrown', () => {
  let num = 0
  let view = new InputView(() => { if (num++ === 0) throw new Error('oops') })
  view.$el.submit()
  view.$el.submit()
  assert.equal(3, view.$el.children('div').length)
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
  view.input.$trigrams.val('HEL LOW ORL D').change()
  view.input.$enumeration.val('5 5!').change()
  view.input.$start.click()
  assert.instanceOf(AnaquoteView, view.anaquote)
  assert.equal(['HEL', 'LOW', 'ORL'], view.anaquote.model.trigrams)
  assert.equal('5 5!', view.anaquote.model.enumeration)
  assert.same(view.anaquote.$el[0], view.$el.children().last()[0])
  assert.hasText('????? ????D!', view.anaquote.quotation.$el)
  assert.instanceOf(WordSet, view.anaquote.model.wordSet)

  view.words = new WordSet(['HELLO', 'WORLD'])
  view.input.$start.click()
  assert.same(view.words, view.anaquote.model.wordSet)
})

test('clicking Start removes the old AnaquoteView first', () => {
  let view = new ApplicationView($('<div>'))
  view.input.$trigrams.val('HEL LOW ORL D').change()
  view.input.$enumeration.val('5 5!').change()
  view.input.$start.click()
  assert.equal(2, view.$el.children().length)

  view.input.$start.click()
  assert.equal(2, view.$el.children().length)
})

test('fetchWords', done => {
  let server = sinon.fakeServer.create()
  server.respondWith('wordListPrefixes.json', '[null, null, ["", "H", "HI"]]')

  // Sinon sets global.XMLHttpRequest, but jquery uses window.XMLHttpRequest.
  // TODO: is there a way to tell sinon to use window as the global object or something?
  window.XMLHttpRequest = global.XMLHttpRequest

  let app = new ApplicationView($('<div>'))
  app.fetchWords()
  assert.hasText('Fetching word list...', app.input.$message)

  server.respond()
  assert.hasText('Processing word list...', app.input.$message)
  
  window.setTimeout(() => {
    try {
      assert.equal(undefined, app.input.$message)
      assert.instanceOf(WordSet, app.words)
      assert(app.words.hasPrefix('H', 2))

      server.restore()
      done()
    } catch (err) {
      done(err)
    }
  })
})

test('fetchWords handles failure', (done) => {
  let server = sinon.fakeServer.create()
  window.XMLHttpRequest = global.XMLHttpRequest
  sinon.stub(console, 'log')
  let clock = sinon.useFakeTimers()

  let app = new ApplicationView($('<div>'))
  app.fetchWords()

  let error
  try {
    server.respond()

    assert(console.log.calledWith('Failed to fetch word list: Not Found'))
    assert.hasClass('error', app.input.$message)
    assert.hasText('Failed to fetch word list: Not Found', app.input.$message)
    assert.equal(undefined, app.words)

    clock.tick(2000)
    assert.equal(undefined, app.input.$message)
  } catch (err) {
    error = err
  }

  console.log.restore()
  clock.restore()
  server.restore()
  done(error)
})

suite('performance')

before('load the word list', () => {
  const fs = require('fs')
  const prefixArrays = JSON.parse(fs.readFileSync(__dirname + '/../anaquote/wordListPrefixes.json'))
  wordSet = new WordSet()
  wordSet.prefixes = prefixArrays.map(a => new Set(a))
})

test('four long words', () => {
  let model = new Anaquote('AGA EXT ILO IZE NZA QUI RAV RDS RGA RIT SBO SMO SOL SPI UAL ZED', '12 12 12 12',
                           wordSet)
  assert.equal(['????????????', 'EXTRAVAGANZA', 'SMORGASBORDS', 'SOLILOQUIZED', 'SPIRITUALIZE'],
               model.wordSelects[0].options())
})
 
test('full sentence', () => {
  let trigrams =
      'ABA AND ARI BOO CPR DGE DNT DOF EDI ESS FIR GER HOL ISG ISH KBU ' +
      'LSE LYI NCL NEC NIE NME NTH PSH ROU STP TDI THE THO UBL UDE WAS'
  let enumeration = "3 6 7 6 2 3 3 5 9 2 4 5'1 8 (3 4'1 11 7 1 5)."
  let model = new Anaquote(trigrams, enumeration, wordSet)
  let view = new AnaquoteView(model).render()
})
