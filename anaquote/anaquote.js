Array.prototype.remove = function (x) {
  let i = this.indexOf(x)
  if (i < 0) return this
  let copy = this.slice()
  copy.splice(i, 1)
  return copy
}
// Note: This only removes one instance of each element of array.
Array.prototype.subtract = function (array) {
  return array.reduce((remainder, x) => remainder.remove(x), this)
}
Array.prototype.sum = function () {
  return this.reduce((sum, i) => sum + i, 0)
}

String.prototype.replaceAt = function(i, str) {
  return this.slice(0, i) + str + this.slice(i + str.length)
}

class Enumeration {
  constructor (enumeration) {
    this.tokens = enumeration.split(/(\d+)/).map(token => {
      let len = Number.parseInt(token)
      return isNaN(len) ? token : len
    }).filter(s => s !== '')
  }
  get wordLengths () {
    return this.tokens.filter(t => typeof t === 'number')
  }
  wordStart(i) {
    return this.wordLengths.slice(0, i).sum()
  }
  words(letters) {
    let start = 0
    return this.wordLengths.map(len => {
      let word = letters.substr(start, len)
      start += len
      return word
    })
  }
  word(i, letters) {
    return letters.substr(this.wordStart(i), this.wordLengths[i])
  }
  get blankString () {
    return this.tokens.map(token => {
      return typeof token === 'string' ? token : '_'.repeat(token)
    }).join('')
  }
  get blanks () {
    return this.blankString.match(/[^_]*_[^_]*_?[^_]*_?[^_]*/g)
  }
  get wordBlanks () {
    return this.blankString.match(/[^_]*_+[^_]*/g)
  }
}

class Anaquote {
  constructor (trigrams, enumeration = '', wordSet = new Set()) {
    this.trigrams = trigrams.split(' ')
    this._enumeration = new Enumeration(enumeration)
    this.enumeration = this._enumeration.tokens
    this._blanks = this._enumeration.blanks
    this._wordBlanks = this._enumeration.wordBlanks
    this.letters = this.trigrams.map(t => t.length === 3 ? '???' : t).join('')
    this.wordSet = wordSet
  }
  get selections () {
    return this.letters.match(/..?.?/g)
  }
  selection(i) {
    return this.letters.substr(i*3, 3)
  }
  select(i, trigram) {
    this.letters = this.letters.replaceAt(i*3, trigram)
  }
  isSelected(i) {
    return this.trigrams.includes(this.selection(i))
  }
  options(i) {
    let selection = this.selection(i)
    if (selection.length < 3) return [selection]
    let otherSelections = this.selections.remove(selection)
    let trigramOptions = this.trigrams.subtract(otherSelections)
    let blank = this.isSelected(i) ? '???' : selection
    if (blank !== '???') {
      let regexp = new RegExp(blank.replace(/\?/g, '.'))
      trigramOptions = trigramOptions.filter(t => regexp.test(t))
    }
    return [blank, ...trigramOptions]
  }
  static fillInBlank(blank, fill) {
    let letters = (fill + '???').split('')
    return blank.split('').map(b => b === '_' ? letters.shift() : b).join('')
  }
  static formatOptions(options, blank) {
    return options.map(o => [o, this.fillInBlank(blank, o)])
  }
  formattedOptions(i) {
    return this.constructor.formatOptions(this.options(i), this._blanks[i])
  }
  quotation() {
    return this.constructor.fillInBlank(this._enumeration.blankString, this.letters)
  }
  get words () {
    return this._enumeration.words(this.letters)
  }
  word(i) {
    return this._enumeration.word(i, this.letters)
  }
  selectWord(i, word) {
    this.letters = this.letters.replaceAt(this._enumeration.wordStart(i), word)
  }
  selectionPermutations(start, end, options = this.trigrams.subtract(this.selections)) {
    if (start > end) return [[]]
    let startOptions = this.isSelected(start) ? [this.selection(start)] : options
    let nextPermSets = startOptions.map(t => {
      let nextPerms = this.selectionPermutations(start + 1, end, options.remove(t))
      return nextPerms.map(p => [t, ...p])
    })
    return [].concat(...nextPermSets)
  }
  wordOptions(i) {
    let word = this.word(i)
    let start = this._enumeration.wordStart(i)
    let len = word.length
    let startTrigram = Math.floor(start / 3)
    let endTrigram = Math.floor((start + len) / 3)  // TODO: should be start+len-1?
    let perms = this.selectionPermutations(startTrigram, endTrigram)
    let offset = start % 3
    let words = perms.map(p => p.join('').substr(offset, len))
    words = words.filter(w => this.wordSet.has(w))
    let blank = word.includes('?') ? word : '?'.repeat(word.length)
    let opts = [blank, ...words, word]
    return [...new Set(opts)] // remove dupes
  }
  formattedWordOptions(i) {
    return this.constructor.formatOptions(this.wordOptions(i), this._wordBlanks[i])
  }
}

class SelectionView {
  constructor (model, i) {
    this.model = model
    this.i = i
    this.$el = $('<select>').addClass('mono')
    this.$el.change(() => { this.modelSelect(this.i, this.$el.val()) })
  }
  get $options () {
    return Array.from(this.$el.prop('options'))
  }
  render() {
    let opts = this.modelOptions(this.i).map(([v,t]) => {
      t = t.replace(/ /g, '&nbsp;')
      return `<option value=${v}>${t}</option>`
    })
    this.$el.empty().append(opts).val(this.modelValue(this.i))
    return this
  }
}

class SelectionsView {
  constructor (model) {
    this.model = model
    this.subviews = this.selections().map((s,i) => new this.subviewClass(model, i))
    this.$el = $('<p>').append(this.subviews.map(v => v.$el))
  }
  render() {
    this.subviews.forEach(v => v.render())    
    return this
  }
}

class TrigramSelectionView extends SelectionView {
  modelOptions(i) { return this.model.formattedOptions(i) }
  modelValue(i) { return this.model.selection(i) }
  modelSelect(i, trigram) { this.model.select(i, trigram) }
}

class WordSelectionView extends SelectionView {
  modelOptions(i) { return this.model.formattedWordOptions(i) }
  modelValue(i) { return this.model.word(i) }
  modelSelect(i, word) { this.model.selectWord(i, word) }
}

class TrigramsView extends SelectionsView {
  get subviewClass () { return TrigramSelectionView }
  selections() { return this.model.selections }
}

class WordsView extends SelectionsView {
  get subviewClass () { return WordSelectionView }
  selections() { return this.model.words }
}

class QuotationView {
  constructor (model) {
    this.model = model
    this.$el = $('<p>')
  }
  render() {
    this.$el.text(this.model.quotation())
    return this
  }
}

class AnaquoteView {
  constructor (model) {
    this.$el = $('<div>')
    this.model = model
    this.quotation = new QuotationView(model)
    this.$el.append(this.quotation.$el)
    this.trigrams = new TrigramsView(model)
    this.$el.append(this.trigrams.$el)
    this.words = new WordsView(model)
    this.$el.append(this.words.$el)
    this.$el.change(() => this.render())
  }
  render() {
    this.trigrams.render()
    this.words.render()
    this.quotation.render()
    return this
  }
}

class InputView {
  constructor () {
    let params = new URL(location).searchParams
    this.$trigrams = $('<input>', {
      name: 'trigrams', placeholder: 'Trigrams', size: '100', val: params.get('trigrams')
    })
    this.$enumeration = $('<input>', {
      name: 'enumeration', placeholder: 'Enumeration', size: '100', val: params.get('enumeration')
    })
    this.$start = $('<button>', { text: 'Start' })
    this.$el = $('<div>').append(this.$trigrams, this.$enumeration, this.$start)
    this.$el.children().wrap('<div>') // to stack them vertically
  }
  newAnaquote(wordSet) { return new Anaquote(this.$trigrams.val(), this.$enumeration.val(), wordSet) }
}

class ApplicationView {
  constructor ($el) {
    this.$el = $el
    this.input = new InputView()
    this.$el.append(this.input.$el)
    this.input.$start.click(() => {
      if (this.anaquote) this.anaquote.$el.remove()
      this.anaquote = new AnaquoteView(this.input.newAnaquote(this.words)).render()
      this.$el.append(this.anaquote.$el)
    })
  }
  fetchWords() {
    $.get('../vendor/NPLCombinedWordList.txt', 'text/plain').done(data => {
      this.words = new Set(data.split(/\r?\n/).map(w => w.toUpperCase()))
      console.log('Fetched wordlist.')
    }).fail(data => {
      console.log('Failed to fetch wordlist:')
      console.log(data.statusText)
    })
  }
}
