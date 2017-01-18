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

class Anaquote {
  constructor (trigrams, enumeration = '') {
    this.trigrams = trigrams.split(' ')
    this.selections = this.trigrams.map(t => '???')
    this.enumeration = this.constructor.parseEnumeration(enumeration)
    this.words = this.enumeration.filter(t => typeof t === 'number').map(n => '?'.repeat(n))
    this.blanks = this.constructor.makeBlanks(this.enumeration)
    this.wordBlanks = this.constructor.makeWordBlanks(this.enumeration)
  }
  options(i) {
    let otherSelections = this.selections.remove(this.selection(i))
    let unselectedTrigrams = this.trigrams.subtract(otherSelections)
    return ['???', ...unselectedTrigrams]
  }
  selection(i) {
    return this.selections[i]
  }
  select(i, trigram) {
    this.selections[i] = trigram
    let string = this.selections.join('')
    let start = 0
    this.words = this.enumeration.filter(t => typeof t === 'number').map(len => {
      let word = string.substr(start, len)
      start += len
      return word
    })
  }
  static parseEnumeration(enumeration) {
    return enumeration.split(/(\d+)/).map(token => {
      let len = Number.parseInt(token)
      return isNaN(len) ? token : len
    }).filter(s => s !== '')
  }
  static makeBlankString(parsedEnumeration) {
    return parsedEnumeration.map(token => {
      return typeof token === 'string' ? token : '_'.repeat(token)
    }).join('')
  }
  static makeBlanks(parsedEnumeration) {
    return this.makeBlankString(parsedEnumeration).match(/[^_]*_[^_]*_?[^_]*_?[^_]*/g)
  }
  static makeWordBlanks(parsedEnumeration) {
    return this.makeBlankString(parsedEnumeration).match(/[^_]*_+[^_]*/g)
  }
  static fillInBlank(blank, fill) {
    let letters = (fill + '???').split('')
    return blank.split('').map(b => b === '_' ? letters.shift() : b).join('')
  }
  static formatOptions(options, blank) {
    return options.map(o => [o, this.fillInBlank(blank, o)])
  }
  formattedOptions(i) {
    return this.constructor.formatOptions(this.options(i), this.blanks[i])
  }
  quotation() {
    return this.selections.map((t, i) => this.constructor.fillInBlank(this.blanks[i], t)).join('')
  }
  word(i) {
    return this.words[i]
  }
  wordOptions(i) {
    return [this.word(i)]
  }
  formattedWordOptions(i) {
    return this.constructor.formatOptions(this.wordOptions(i), this.wordBlanks[i])
  }
}

class SelectionView {
  constructor (model, i) {
    this.model = model
    this.i = i
    this.$el = $('<select>').addClass('mono')
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
  constructor (model, i) {
    super(model, i)
    this.$el.change(() => { this.model.select(this.i, this.$el.val()) })
  }
  modelOptions(i) { return this.model.formattedOptions(i) }
  modelValue(i) { return this.model.selection(i) }
}

class WordSelectionView extends SelectionView {
  modelOptions(i) { return this.model.formattedWordOptions(i) }
  modelValue(i) { return this.model.word(i) }
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
  newAnaquote() { return new Anaquote(this.$trigrams.val(), this.$enumeration.val()) }
}

class ApplicationView {
  constructor ($el) {
    this.$el = $el
    this.input = new InputView()
    this.$el.append(this.input.$el)
    this.input.$start.click(() => {
      if (this.anaquote) this.anaquote.$el.remove()
      this.anaquote = new AnaquoteView(this.input.newAnaquote()).render()
      this.$el.append(this.anaquote.$el)
    })
    this.words = new Set()
  }
  fetchWords() {
    $.get('../vendor/NPLCombinedWordList.txt', 'text/plain').done(data => {
      this.words = new Set(data.split(/\r?\n/))
      console.log('Fetched wordlist.')
    }).fail(data => {
      console.log('Failed to fetch wordlist:')
      console.log(data.statusText)
    })
  }
}
