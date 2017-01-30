Array.prototype.last = function () {
  return this[this.length - 1]
}
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
Array.prototype.sum = function (fn = x => x) {
  return this.reduce((sum, x) => sum + fn(x), 0)
}
Array.prototype.squeeze = function () {
  let s = []
  this.forEach((x, i) => {
    if (i === 0 || x !== s.last()) s.push(x)
  })
  return s
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

class WordSet extends Set {
  constructor (words = []) {
    super(words)
    let prefixes = []
    words.forEach(word => {
      let len = word.length
      if (!prefixes[len]) prefixes[len] = new Set()
      for (let i = 0; i <= len; i++) prefixes[len].add(word.substr(0, i))
    })
    this.prefixes = prefixes
  }
  hasPrefix(prefix, wordLength) {
    return this.prefixes[wordLength] && this.prefixes[wordLength].has(prefix)
  }
}

class Blank {
  constructor (string) {
    this._string = string
    this._tokens = string.split(/(\d+)/).map(token => {
      let len = Number.parseInt(token)
      return isNaN(len) ? token : len
    }).filter(s => s !== '')
    this.length = this._tokens.filter(t => typeof(t) === 'number').sum()
    this.formattedLength = this._tokens.sum(t => typeof(t) === 'number' ? t : t.length)
  }
  toString() { return this._string }

  trigramBlanks() {
    let blanks = [], str = '', need = 3
    this._tokens.forEach(t => {
      if (typeof t === 'number') {
        while (t > need) {
          t -= need
          if (need > 0) str += need
          blanks.push(new Blank(str))
          str = ''
          need = 3
        }
        need -= t
      }
      str += t
    })
    if (str.length > 0) blanks.push(new Blank(str))
    return blanks
  }
  fillIn(fill) {
    let filled = [], i = 0
    for (let t of this._tokens) {
      if (typeof t === 'string') {
        filled.push(t)
      } else {
        filled.push(fill.substr(i, t))
        i += t
        if (i > fill.length) break
      }
    }
    return filled.join('')
  }
  trim() {
    // Allow smart-apostrophe, but our word list only has ASCII apostrophe.
    let string = this._string.replace(/\u2019/g, "'")
    return new Blank(string.replace(/[^-_\/'0-9]/g, ''))
  }
}

class Enumeration {
  constructor (string) {
    this.blank = new Blank(string)
    this.trigramBlanks = this.blank.trigramBlanks()
    this.wordBlanks = string.trim().match(/[^\d]*\d+[^\s]*\s*/g).map(s => new Blank(s))

    let total = 0
    this.wordStarts = this.wordBlanks.map(b => {
      let start = total
      total += b.length
      return start
    })
    this.trimmedBlanks = this.wordBlanks.map(b => b.trim())
  }
  toString() { return this.blank.toString() }
  get length () { return this.blank.length }
  get numWords () { return this.wordBlanks.length }

  wordStart(i) {
    return this.wordStarts[i]
  }
  word(i, string) {
    return string.substr(this.wordStarts[i], this.wordBlanks[i].length)
  }
  words(string) {
    return this.numWords.times.map(i => this.word(i, string))
  }
  trigramRangeForWord(i) {
    let start = this.wordStarts[i]
    let len = this.wordBlanks[i].length
    let startTrigram = Math.floor(start / 3)
    let endTrigram = Math.floor((start + len - 1) / 3)
    return [startTrigram, endTrigram]
  }
}

class Anaquote {
  constructor (trigrams, enumeration, wordSet = new WordSet()) {
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

    this.selectedString = this.trigrams.map(t => t.length === 3 ? '???' : t).join('')

    if (enumeration) {
      this.enumeration = new Enumeration(enumeration)
      let trigramsTotal = this.trigrams.join('').length
      if (this.enumeration.length > trigramsTotal)
        throw new Error('Enumeration is too long!')
      else if (this.enumeration.length < trigramsTotal)
        throw new Error('Enumeration is too short!')
    }

    this.wordSet = wordSet
  }

  get selectedString () { return this._selectedString }
  set selectedString (string) {
    this._selectedString = string
    this.selectedTrigrams.forEach((t, i) => {
      // Unselect partially-selected trigrams that now have no options.
      if (t !== '???' && t.includes('?') && this.availableTrigrams(i).length === 0)
        string = string.replaceAt(i*3, '???')
    })
    this._selectedString = string
  }

  get selectedTrigrams () {
    return this.selectedString.match(/..?.?/g)
  }
  selectedTrigram(i) {
    return this.selectedString.substr(i*3, 3)
  }
  selectTrigram(i, trigram) {
    this.selectedString = this.selectedString.replaceAt(i*3, trigram)
  }
  availableTrigrams(i) {
    let trigram = this.selectedTrigram(i)
    if (trigram.length < 3) return [trigram]
    let otherSelectedTrigrams = this.selectedTrigrams.remove(trigram)
    let avail = this.trigrams.subtract(otherSelectedTrigrams)
    if (trigram.includes('?')) {
      let regexp = new RegExp(trigram.replace(/\?/g, '.'))
      avail = avail.filter(t => regexp.test(t))
    }
    return avail
  }
  trigramOptions(i) {
    let trigram = this.selectedTrigram(i)
    if (trigram.length < 3) return [trigram]
    let opts = this.availableTrigrams(i)
    if (trigram.includes('?')) opts.unshift(trigram)
    return ['???', ...opts].squeeze()
  }

  get selectedWords () {
    return this.enumeration.words(this.selectedString)
  }
  selectedWord(i) {
    return this.enumeration.word(i, this.selectedString)
  }
  selectWord(i, word) {
    this.selectedString = this.selectedString.replaceAt(this.enumeration.wordStart(i), word)
    if (word.includes('?')) return
    // Auto-select unique trigrams that overlap the word.
    this.enumeration.trigramRangeForWord(i).forEach(i => {
      if (this.selectedTrigram(i).includes('?')) {
        let avail = this.availableTrigrams(i).squeeze()
        if (avail.length === 1) this.selectTrigram(i, avail[0])
      }
    })
  }
  unselectedWordOption(i) {
    let len = this.enumeration.wordBlanks[i].length
    if (i === this.enumeration.numWords - 1) {
      // Don't unselect the leftover (the final non-trigram).
      let leftoverLength = this.selectedString.length % 3
      let leftover = this.selectedString.substr(-leftoverLength, leftoverLength)
      return '?'.repeat(len - leftoverLength) + leftover
    }
    return '?'.repeat(len)
  }
  // TODO: move this to Array? maybe named productWithoutRepeats or something??
  static permuteOptions(optionArrays, checkPrefix = x => true, selections = []) {
    if (!checkPrefix(selections)) return []
    if (optionArrays.length === 0) return [[]]
    let options = optionArrays[0].subtract(selections)
    let restOptionArrays = optionArrays.slice(1)
    return options.flatMap(selection => {
      let newSelections = [...selections, selection]
      let permutations = this.permuteOptions(restOptionArrays, checkPrefix, newSelections)
      return permutations.map(permutation => [selection, ...permutation])
    })
  }
  optionArraysForWord(i) {
    let word = this.selectedWord(i)
    let fullySelected = !word.includes('?')
    let selectedTrigrams = this.selectedTrigrams
    if (fullySelected) {
      // Act as if the word is unselected, to include all alternative word candidates.
      let string = this.selectedString.replaceAt(this.enumeration.wordStart(i), this.unselectedWordOption(i))
      selectedTrigrams = string.match(/..?.?/g)
    }
    let availableTrigrams = this.trigrams.subtract(selectedTrigrams)
    let [first, last] = this.enumeration.trigramRangeForWord(i)
    return first.upTo(last).map(i => {
      let trigram = selectedTrigrams[i]
      if (!trigram.includes('?')) return [trigram]
      let regexp = new RegExp(trigram.replace(/\?/g, '.'))
      return availableTrigrams.filter(t => regexp.test(t))
    })
  }
  wordCandidates(i) {
    let blank = this.enumeration.trimmedBlanks[i]
    let offset = this.enumeration.wordStart(i) % 3
    let len = this.selectedWord(i).length
    function permutationToWord(p) { return p.join('').substr(offset, len) }
    return this.constructor.permuteOptions(this.optionArraysForWord(i), perm => {
      let prefix = blank.fillIn(permutationToWord(perm))
      return this.wordSet.hasPrefix(prefix, blank.formattedLength)
    }).map(permutationToWord)
  }
  wordOptions(i) {
    return [this.unselectedWordOption(i), this.selectedWord(i), ...this.wordCandidates(i)].sort().squeeze()
  }

  static formatOptions(options, blank) {
    return options.map(o => [o, blank.fillIn(o)])
  }
  formattedTrigramOptions(i) {
    if (!this.enumeration) return this.trigramOptions(i).map(o => [o, o])
    return this.constructor.formatOptions(this.trigramOptions(i), this.enumeration.trigramBlanks[i])
  }
  formattedWordOptions(i) {
    return this.constructor.formatOptions(this.wordOptions(i), this.enumeration.wordBlanks[i])
  }
  quotation() {
    return this.enumeration ? this.enumeration.blank.fillIn(this.selectedString) : this.selectedString
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
  modelOptions(i) { return this.model.formattedTrigramOptions(i) }
  modelValue(i) { return this.model.selectedTrigram(i) }
  modelSelect(i, trigram) { this.model.selectTrigram(i, trigram) }
}

class WordSelectionView extends SelectionView {
  modelOptions(i) { return this.model.formattedWordOptions(i) }
  modelValue(i) { return this.model.selectedWord(i) }
  modelSelect(i, word) { this.model.selectWord(i, word) }
}

class TrigramsView extends SelectionsView {
  get subviewClass () { return TrigramSelectionView }
  selections() { return this.model.selectedTrigrams }
}

class WordsView extends SelectionsView {
  get subviewClass () { return WordSelectionView }
  selections() { return this.model.selectedWords }
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
      this.words = new WordSet(data.split(/\r?\n/).map(w => w.toUpperCase()))
      console.log('Fetched wordlist.')
    }).fail(data => {
      console.log('Failed to fetch wordlist:')
      console.log(data.statusText)
    })
  }
}
