class Anaquote {
  constructor (trigrams, enumeration = '') {
    this.trigrams = trigrams.split(' ')
    this.selections = this.trigrams.map(t => '???')
    this.enumeration = enumeration
    this.blanks = this.constructor.makeBlanks(this.enumeration)
  }
  options(i) {
    function del(array, elt) { // 'delete' is a keyword...
      let i = array.indexOf(elt)
      if (i >= 0) array.splice(i, 1)
      return array
    }
    function remove(array, elt) { return del(array.slice(), elt) }
    function subtract(array1, array2) {
      let copy = array1.slice()
      array2.forEach(x => del(copy, x))
      return copy
    }
    let otherSelections = remove(this.selections, this.selection(i))
    let unselectedTrigrams = subtract(this.trigrams, otherSelections)
    return ['???', ...unselectedTrigrams]
  }
  selection(i) {
    return this.selections[i]
  }
  select(i, trigram) {
    this.selections[i] = trigram
  }
  static makeBlanks(enumeration) {
    // TODO: there's gotta be a better way to do this...
    let blanks = []
    let blank = ''
    let i = 0
    enumeration.split(/(\d+)/).forEach(token => {
      let len = Number.parseInt(token)
      if (isNaN(len)) {
        blank += token
      } else {
        for (let j = 0; j < len; j++) {
          if (i === 3) {
            blanks.push(blank)
            blank = ''
            i = 0
          }
          blank += '?'
          i++
        }
      }
    })
    if (blank.length > 0) blanks.push(blank)
    return blanks
  }
  fillInBlank(i, trigram) {
    let letters = (trigram + '???').split('')
    return this.blanks[i].split('').map(blank => blank === '?' ? letters.shift() : blank).join('')
  }
  formattedOptions(i) {
    return this.options(i).map(o => [o, this.fillInBlank(i, o)])
  }
  quotation() {
    return this.selections.map((t, i) => this.fillInBlank(i, t)).join('')
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
  render() {
    let opts = this.model.formattedOptions(this.i).map(([v,t]) => {
      t = t.replace(/ /g, '&nbsp;')
      return `<option value=${v}>${t}</option>`
    })
    this.$el.empty().append(opts).val(this.model.selection(this.i))
    return this
  }
}

class TrigramsView extends SelectionsView {
  get subviewClass () { return TrigramSelectionView }
  selections() { return this.model.selections }
}

class WordSelectionView extends SelectionView {
  render() {
    this.$el.append('<option>?????</option>').val('?????')
    return this
  }
}

class WordsView extends SelectionsView {
  get subviewClass () { return WordSelectionView }
  selections() { return [1, 2] }
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
