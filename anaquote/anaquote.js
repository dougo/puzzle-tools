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
Array.prototype.uniq = function () {
  return [...new Set(this)]
}
Array.prototype.flatMap = function (f) {
  return [].concat(...this.map(f))
}

String.prototype.replaceAt = function(i, str) {
  return this.slice(0, i) + str + this.slice(i + str.length)
}

Number.prototype.upTo = function (n) {
  return n < this ? [] : Array.from(Array(n - this + 1), (_, i) => this + i)
}
Object.defineProperty(Number.prototype, 'times', {
  get: function () { return (0).upTo(this - 1) }
})

class Enumeration {
  constructor (string) {
    this.string = string
    
    this.tokens = string.trim().split(/(\d+)/).map(token => {
      let len = Number.parseInt(token)
      return isNaN(len) ? token : len
    }).filter(s => s !== '')

    this.wordLengths = string.split(/\s+/).map(wordPattern => {
      let lengths = wordPattern.match(/\d+/g)
      return lengths === null ? false : lengths.map(s => Number.parseInt(s)).sum()
    }).filter(l => l)

    this.numWords = this.wordLengths.length

    let total = 0
    this.wordStarts = this.wordLengths.map(len => {
      let start = total
      total += len
      return start
    })

    this.blankString = this.tokens.map(token => {
      return typeof token === 'string' ? token : '_'.repeat(token)
    }).join('')

    this.blanks = this.blankString.match(/[^_]*_[^_]*_?[^_]*_?[^_]*/g)

    this.wordBlanks = this.blankString.match(/[^_]*_+[^\s]*\s*/g)
  }
  wordLength(i) {
    return this.wordLengths[i]
  }
  wordStart(i) {
    return this.wordStarts[i]
  }
  word(i, letters) {
    return letters.substr(this.wordStarts[i], this.wordLengths[i])
  }
  words(letters) {
    return this.numWords.times.map(i => this.word(i, letters))
  }
  trigramRangeForWord(i) {
    let start = this.wordStarts[i]
    let len = this.wordLengths[i]
    let startTrigram = Math.floor(start / 3)
    let endTrigram = Math.floor((start + len - 1) / 3)
    return [startTrigram, endTrigram]
  }
}

class Anaquote {
  constructor (trigrams, enumeration, wordSet = new Set()) {
    this.trigrams = trigrams.trim().toUpperCase().split(/\s+/)

    let leftover
    this.trigrams.forEach(t => {
      if (t.length > 3) throw new Error('Not a trigram: ' + t)
      else if (t.length < 3) {
        if (leftover) throw new Error(`More than one leftover: ${leftover} ${t}`)
        leftover = t
      }
    })

    this.trigrams = this.trigrams.sort((a, b) => {
      if (a.length !== b.length) return b.length - a.length // put leftover at the end
      return a.localeCompare(b)
    })

    this.letters = this.trigrams.map(t => t.length === 3 ? '???' : t).join('')

    if (enumeration) {
      this.enumeration = new Enumeration(enumeration)
      let total = this.enumeration.wordLengths.sum()
      if (total > this.letters.length)
        throw new Error('Enumeration is too long!')
      else if (total < this.letters.length)
        throw new Error('Enumeration is too short!')
    }

    this.wordSet = wordSet
  }

  get letters () { return this._letters }
  set letters (letters) {
    this._letters = letters
    this.selections.forEach((t, i) => {
      if (t !== '???' && t.includes('?') && this.available(i).length === 0)
        letters = letters.replaceAt(i*3, '???')
    })
    this._letters = letters
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
  available(i) {
    let selection = this.selection(i)
    if (selection.length < 3) return [selection]
    let otherSelections = this.selections.remove(selection)
    let avail = this.trigrams.subtract(otherSelections)
    if (selection.includes('?')) {
      let regexp = new RegExp(selection.replace(/\?/g, '.'))
      avail = avail.filter(t => regexp.test(t))
    }
    return avail
  }
  options(i) {
    let selection = this.selection(i)
    if (selection.length < 3) return [selection]
    let opts = this.available(i)
    if (selection.includes('?')) opts.unshift(selection)
    return ['???', ...opts].uniq()
  }

  get words () {
    return this.enumeration.words(this.letters)
  }
  word(i) {
    return this.enumeration.word(i, this.letters)
  }
  selectWord(i, word) {
    this.letters = this.letters.replaceAt(this.enumeration.wordStart(i), word)
    if (word.includes('?')) return
    // Auto-select unique trigrams that overlap the word.
    this.enumeration.trigramRangeForWord(i).forEach(i => {
      if (this.selection(i).includes('?')) {
        let avail = this.available(i).uniq()
        if (avail.length === 1) this.select(i, avail[0])
      }
    })
  }
  unselectedWordOption(i) {
    let len = this.enumeration.wordLength(i)
    if (i === this.enumeration.numWords - 1) {
      // Don't unselect the leftover (the final non-trigram).
      let leftoverLength = this.letters.length % 3
      let leftover = this.letters.substr(-leftoverLength, leftoverLength)
      return '?'.repeat(len - leftoverLength) + leftover
    }
    return '?'.repeat(len)
  }
  // TODO: move this to Array? maybe named productWithoutRepeats or something??
  static permuteOptions(optionArrays, selections = []) {
    if (optionArrays.length === 0) return [[]]
    let options = optionArrays[0].subtract(selections)
    let restOptionArrays = optionArrays.slice(1)
    return options.flatMap(selection => {
      let newSelections = [selection, ...selections]
      let permutations = this.permuteOptions(restOptionArrays, newSelections)
      return permutations.map(permutation => [selection, ...permutation])
    })
  }
  optionArraysForWord(i) {
    let word = this.word(i)
    let fullySelected = !word.includes('?')
    let selections = this.selections
    if (fullySelected) {
      // Act as if the word is unselected, to include all alternative word candidates.
      let letters = this.letters.replaceAt(this.enumeration.wordStart(i), this.unselectedWordOption(i))
      selections = letters.match(/..?.?/g)
    }
    let availableTrigrams = this.trigrams.subtract(selections)
    let [first, last] = this.enumeration.trigramRangeForWord(i)
    return first.upTo(last).map(i => {
      let selection = selections[i]
      if (!selection.includes('?')) return [selection]
      let regexp = new RegExp(selection.replace(/\?/g, '.'))
      return availableTrigrams.filter(t => regexp.test(t))
    })
  }
  wordCandidates(i) {
    let offset = this.enumeration.wordStart(i) % 3
    let len = this.word(i).length
    return this.constructor.permuteOptions(this.optionArraysForWord(i)).map(p => p.join('').substr(offset, len))
  }
  wordOptions(i) {
    let words = this.wordCandidates(i).filter(w => {
      w = this.constructor.fillInBlank(this.enumeration.wordBlanks[i], w)
      w = w.replace(/\u2019/g, "'") // Allow smart-apostrophe, but our word list only has ASCII apostrophe.
      w = w.replace(/[^-\/'A-Z0-9]/g, '')
      return this.wordSet.has(w)
    })
    let word = this.word(i)
    if (word.includes('?')) words.unshift(word)
    return [this.unselectedWordOption(i), ...words, word].uniq().sort()
  }

  static fillInBlank(blank, fill) {
    let letters = (fill + '???').split('')
    return blank.split('').map(b => b === '_' ? letters.shift() : b).join('')
  }
  static formatOptions(options, blank) {
    return options.map(o => [o, this.fillInBlank(blank, o)])
  }
  formattedOptions(i) {
    if (!this.enumeration) return this.options(i).map(o => [o, o])
    return this.constructor.formatOptions(this.options(i), this.enumeration.blanks[i])
  }
  formattedWordOptions(i) {
    return this.constructor.formatOptions(this.wordOptions(i), this.enumeration.wordBlanks[i])
  }
  quotation() {
    if (!this.enumeration) return this.letters
    return this.constructor.fillInBlank(this.enumeration.blankString, this.letters)
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
    if (model.enumeration) {
      this.words = new WordsView(model)
      this.$el.append(this.words.$el)
    }
    this.$el.change(() => this.render())
  }
  render() {
    this.trigrams.render()
    if (this.words) this.words.render()
    this.quotation.render()
    return this
  }
}

class InputView {
  constructor (callback = () => { }) {
    let params = new URL(location).searchParams
    let trigrams = params.get('trigrams'), enumeration = params.get('enumeration')

    this.$start = $('<button>', { type: 'submit', text: 'Start' })

    this.$trigrams = $('<input>', {
      name: 'trigrams', placeholder: 'Trigrams', size: '100', val: trigrams
    })
    this.$trigrams.change(() => {
      this.$start.prop('disabled', !this.$trigrams.val())
    }).change()

    this.$enumeration = $('<input>', {
      name: 'enumeration', placeholder: 'Enumeration', size: '100', val: enumeration
    })

    this.$el = $('<form>').append(this.$trigrams, this.$enumeration, this.$start)
    this.$el.children().wrap('<div>') // to stack them vertically
    this.$el.submit(event => {
      event.preventDefault()
      if (this.$error) this.$error.remove()
      try { callback(this.$trigrams.val(), this.$enumeration.val()) }
      catch (e) {
        this.$error = $('<div>', { class: 'error', text: e.message })
        this.$el.append(this.$error)
        return
      }
      $(document.activeElement).blur()
    })
  }
}

class ApplicationView {
  constructor ($el) {
    this.$el = $el
    this.input = new InputView((trigrams, enumeration) => {
      if (this.anaquote) this.anaquote.$el.remove()
      this.anaquote = new AnaquoteView(new Anaquote(trigrams, enumeration, this.words)).render()
      this.$el.append(this.anaquote.$el)
    })
    this.$el.append(this.input.$el)
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
