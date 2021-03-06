Array.prototype.first = function () { return this[0] }
Array.prototype.last = function () { return this[this.length - 1] }

Object.defineProperty(Array.prototype, 'isEmpty', { get: function () { return !this.length } })
              
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
Array.prototype.productWithoutRepeats = function (checkPrefix = x => true, selections = []) {
  if (!checkPrefix(selections)) return []
  if (this.isEmpty) return [[]]
  let options = this[0].subtract(selections)
  let rest = this.slice(1)
  return options.flatMap(selection => {
    let newSelections = [...selections, selection]
    let permutations = rest.productWithoutRepeats(checkPrefix, newSelections)
    return permutations.map(permutation => [selection, ...permutation])
  })
}

String.prototype.replaceAt = function(i, str) {
  return this.slice(0, i) + str + this.slice(i + str.length)
}

Number.prototype.upTo = function (n) {
  return n < this ? [] : Array.from(Array(n - this + 1), (_, i) => this + i)
}

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
  constructor (string, offset = 0) {
    this._string = string
    this._tokens = string.split(/(\d+)/).map(token => {
      let len = Number.parseInt(token)
      return isNaN(len) ? token : len
    })
    this.prefix = this._tokens.first()
    this.suffix = this._tokens.last()
    this.length = this._tokens.filter(t => typeof(t) === 'number').sum()
    this.formattedLength = this._tokens.slice(1, -1).sum(t => typeof(t) === 'number' ? t : t.length)
    this.offset = offset
  }
  toString() { return this._string }

  trigramBlanks() {
    let blanks = [], str = '', need = 3, offset = 0
    this._tokens.forEach(t => {
      if (typeof t === 'number') {
        while (t > need) {
          t -= need
          if (need > 0) str += need
          blanks.push(new Blank(str, offset))
          str = ''
          need = 3
          offset += 3
        }
        need -= t
      }
      str += t
    })
    if (str.length > 0) blanks.push(new Blank(str, offset))
    return blanks
  }
  fillIn(fill) {
    let filled = [], i = 0
    for (let t of this._tokens.slice(1, -1)) {
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
  sanitize() {
    // Translate smart-apostrophe to ASCII apostrophe, for looking up in the word list.
    return new Blank(this._string.replace(/\u2019/g, "'"), this.offset)
  }
  formatOptions(options) {
    return options.map(o => [o, this.fillIn(o)])
  }
}

class Enumeration {
  constructor (string) {
    this.blank = new Blank(string)
    this.trigramBlanks = this.blank.trigramBlanks()

    let offset = 0
    this.wordBlanks = string.trim().match(/[^\d]*\d+[^\s]*\s*/g).map(s => {
      let blank = new Blank(s, offset)
      offset += blank.length
      return blank
    })
  }
  toString() { return this.blank.toString() }
  get length () { return this.blank.length }
}

class Quotation {
  constructor (value, enumeration) {
    this.value = value
    this.enumeration = enumeration || new Enumeration(value.length.toString())
  }
  toString() { return this.value }
  replaceAt(offset, string) {
    this.value = this.value.replaceAt(offset, string)
  }
  get formattedValue () {
    let blank = this.enumeration.blank
    return blank.prefix + blank.fillIn(this.value) + blank.suffix
  }
  get selectedTrigrams () {
    return this.value.match(/.../g)
  }
}

class SubstringSelect {
  constructor (anaquote, blank) {
    this.anaquote = anaquote
    this.blank = blank
  }
  get offset () { return this.blank.offset }
  get quotation () { return this.anaquote.quotation }
  get length () { return this.blank.length }
  get unselectOption () { return '?'.repeat(this.length) }

  get value () {
    return this.quotation.value.substr(this.offset, this.length)
  }
  set value (value) {
    this.quotation.replaceAt(this.offset, value)
  }
  get isUnselected ()        { return this.value === this.unselectOption }
  get isPartiallySelected () { return !this.isUnselected && !this.isFullySelected }
  get isFullySelected ()     { return !this.value.includes('?') }

  select(value) {
    this.value = value
    // Unselect partially-selected trigrams that now have no options.
    this.anaquote.trigramSelects.forEach(select => {
      if (select.isPartiallySelected && select.available().isEmpty)
        select.value = '???'
    })
  }
  options() {
    return [this.unselectOption, this.value, ...this.available()].sort().squeeze()
  }
  formattedOptions() {
    return this.blank.formatOptions(this.options())
  }
}

class TrigramSelect extends SubstringSelect {
  get trigrams () { return this.anaquote.trigrams }
  available() {
    let trigram = this.value
    let otherSelections = this.quotation.selectedTrigrams.remove(trigram)
    let avail = this.trigrams.subtract(otherSelections)
    if (this.isPartiallySelected) {
      let regexp = new RegExp(trigram.replace(/\?/g, '.'))
      avail = avail.filter(t => regexp.test(t))
    }
    return avail
  }
}

class WordSelect extends SubstringSelect {
  select(word) {
    super.select(word)
    if (!this.isFullySelected) return
    // Auto-select unique trigrams that overlap the word.
    this._trigramExtent().forEach(i => {
      let trigramSelect = this.anaquote.trigramSelect(i)
      if (trigramSelect.isPartiallySelected) {
        let avail = trigramSelect.available().squeeze()
        if (avail.length === 1) trigramSelect.select(avail[0])
      }
    })
  }
  get unselectOption () {
    let opt = super.unselectOption
    // TODO: what if leftoverLength is 2 and the last word is 1?
    if (this.offset + this.length === this.quotation.value.length) {
      // Don't unselect the leftover (the final non-trigram).
      let leftover = this.anaquote.leftover
      opt = opt.replaceAt(this.length - leftover.length, leftover)
    }
    return opt
  }
  available() {
    let selectedTrigrams = this.quotation.selectedTrigrams
    if (this.isFullySelected) {
      // Act as if the word is unselected, to include all alternative word candidates.
      let allWithoutThis = this.quotation.value.replaceAt(this.offset, this.unselectOption)
      selectedTrigrams = allWithoutThis.match(/.../g)
    }
    let unselectedTrigrams = new Set(this.anaquote.trigrams.subtract(selectedTrigrams))
    return this._trigramSequencesThatFormWords.filter(trigrams => {
      return this._isAllowedTrigramSequence(trigrams, selectedTrigrams, unselectedTrigrams)
    }).map(trigrams => {
      return this._wordFromTrigramSequence(trigrams)
    })
  }
  get _trigramSequencesThatFormWords () {
    if (!this._tstfw) {
      let trigramOptionArrays = this._startTrigram.upTo(this._endTrigram).map(i => {
        if (i === this.anaquote.trigrams.length) return [this.anaquote.leftover]
        return this.anaquote.trigrams
      })
      this._tstfw = trigramOptionArrays.productWithoutRepeats(trigramsPrefix => {
        return this._isWordPrefix(this._wordFromTrigramSequence(trigramsPrefix))
      })
    }
    return this._tstfw
  }
  get _startTrigram () { return Math.floor(this.offset / 3) }
  get _endTrigram   () { return Math.floor((this.offset + this.length - 1) / 3) }
  _trigramExtent    () { return [this._startTrigram, this._endTrigram] }

  _isAllowedTrigramSequence(seq, selectedTrigrams, unselectedTrigrams) {
    return seq.every((t, i) => {
      return this._isAllowedTrigram(t, i + this._startTrigram, selectedTrigrams, unselectedTrigrams)
    })
  }
  _isAllowedTrigram(t, i, selectedTrigrams, unselectedTrigrams) {
    if (i === selectedTrigrams.length) return true
    let trigram = selectedTrigrams[i]
    if (!trigram.includes('?')) return t === trigram
    let regexp = new RegExp(trigram.replace(/\?/g, '.'))
    return regexp.test(t) && unselectedTrigrams.has(t)
  }
  _wordFromTrigramSequence(seq) {
    return seq.join('').substr(this.offset % 3, this.length)
  }
  _isWordPrefix(letters) {
    let prefixWithPunctuation = this._lookupBlank.fillIn(letters)
    return this.anaquote.wordSet.hasPrefix(prefixWithPunctuation, this._lookupBlank.formattedLength)
  }
  get _lookupBlank () {
    return this.__lookupBlank = this.__lookupBlank || this.blank.sanitize()
  }
}

class Anaquote {
  constructor (trigrams, enumeration, wordSet = new WordSet()) {
    trigrams = trigrams.trim().toUpperCase().split(/\s+/)

    let leftover = ''
    trigrams.forEach(t => {
      if (t.length > 3) throw new Error('Not a trigram: ' + t)
      else if (t.length < 3) {
        if (leftover) throw new Error(`More than one leftover: ${leftover} ${t}`)
        leftover = t
      }
    })

    this.trigrams = trigrams = trigrams.filter(t => t.length === 3).sort()
    this.leftover = leftover

    let unselectedString = '?'.repeat(trigrams.length * 3) + leftover

    if (enumeration) {
      this.enumeration = enumeration = new Enumeration(enumeration)
      if (enumeration.length > unselectedString.length)
        throw new Error('Enumeration is too long!')
      else if (enumeration.length < unselectedString.length)
        throw new Error('Enumeration is too short!')
    }

    this.quotation = new Quotation(unselectedString, enumeration)

    this.wordSet = wordSet
  }
  trigramSelect(i) {
    return new TrigramSelect(this, this.quotation.enumeration.trigramBlanks[i])
  }
  get trigramSelects () {
    let trigramSelects = this.trigrams.map((t, i) => this.trigramSelect(i))
    if (this.leftover && this.trigrams.length) {
      let lastSelect = trigramSelects.last()
      let leftoverBlank = this.quotation.enumeration.trigramBlanks.last()
      lastSelect.blank = new Blank(lastSelect.blank + leftoverBlank.fillIn(this.leftover) + leftoverBlank.suffix)
    }
    return trigramSelects
  }
  get wordSelects () {
    return this.enumeration.wordBlanks.map(blank => new WordSelect(this, blank))
  }
}

class SelectView {
  constructor (model) {
    this.model = model
    this.$select = $('<select>').change(() => this.model.select(this.$select.val()))
    this.$el = $('<span>').append(this.$select)
    this.$el.prepend(this.model.blank.prefix)
    this.$el.append(this.model.blank.suffix)
  }
  get $options () {
    return Array.from(this.$select.prop('options'))
  }
  render() {
    let opts = this.model.formattedOptions().map(([v,t]) => {
      t = t.replace(/ /g, '&nbsp;')
      return `<option value=${v}>${t}</option>`
    })
    this.$select.empty().append(opts).val(this.model.value)
    return this
  }
}

class SelectsView {
  constructor (models) {
    this.subviews = models.map(model => new SelectView(model))
    this.$el = $('<p>', { class: 'mono', append: this.subviews.map(v => v.$el) })
  }
  render() {
    this.subviews.forEach(v => v.render())    
    return this
  }
}

class QuotationView {
  constructor (model) {
    this.model = model
    this.$el = $('<p>')
  }
  render() {
    this.$el.text(this.model.formattedValue)
    return this
  }
}

class AnaquoteView {
  constructor (model) {
    this.$el = $('<div>')
    this.model = model
    this.quotation = new QuotationView(model.quotation)
    this.$el.append(this.quotation.$el)
    this.trigrams = new SelectsView(model.trigramSelects)
    this.$el.append(this.trigrams.$el)
    if (model.enumeration) {
      this.words = new SelectsView(model.wordSelects)
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
      this.clearMessage()
      try { callback(this.$trigrams.val(), this.$enumeration.val()) }
      catch (e) {
        this.setMessage(e.message, 'error')
        return
      }
      $(document.activeElement).blur()
    })
  }
  setMessage(message, className = 'message') {
    this.clearMessage()
    this.$message = $('<div>', { class: className, text: message })
    this.$el.append(this.$message)
  }
  clearMessage() {
    if (this.$message) this.$message.remove()
    delete this.$message
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
    let jqxhr = $.getJSON('wordListPrefixes.json')
    this.input.setMessage('Fetching word list...')
    jqxhr.done(prefixArrays => {
      this.input.setMessage('Processing word list...')
      window.setTimeout(() => {
        this.words = new WordSet()
        this.words.prefixes = prefixArrays.map(a => new Set(a))
        this.input.clearMessage()
      })
    }).fail(jqXHR => {
      var msg = 'Failed to fetch word list: ' + jqXHR.statusText
      this.input.setMessage(msg, 'error')
      console.log(msg)
      window.setTimeout(() => this.input.clearMessage(), 2000)
    })
  }
}
