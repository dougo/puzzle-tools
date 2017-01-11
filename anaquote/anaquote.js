class Anaquote {
  set trigrams (trigrams) {
    this._trigrams = trigrams
    this.selections = trigrams.map(t => '___')
  }
  options(i) {
    let otherSelections = new Set(this.selections)
    otherSelections.delete(this.selection(i))
    return ['___', ...this._trigrams.filter(t => !otherSelections.has(t))]
  }
  selection(i) {
    return this.selections[i]
  }
  select(i, trigram) {
    this.selections[i] = trigram
  }
  set enumeration (enumeration) {
    this._enumeration = enumeration
    this.blanks = this.constructor.makeBlanks(enumeration)
  }
  static makeBlanks(enumeration) {
    // TODO: there's gotta be a better way to do this...
    let blanks = []
    let blank = ''
    let i = 1
    enumeration.split(/(\d+)/).forEach(token => {
      let len = Number.parseInt(token)
      if (isNaN(len)) {
        blank += token
      } else {
        for (let j = 0; j < len; j++) {
          blank += '_'
          if (i++ == 3) {
            blanks.push(blank)
            blank = ''
            i = 1
          }
        }
      }
    })
    if (i > 1) blanks.push(blank)
    return blanks
  }
  fillInBlank(i, trigram) {
    let letters = (trigram + '___').split('')
    return this.blanks[i].split('').map(blank => blank === '_' ? letters.shift() : blank).join('')
  }
  formattedOptions(i) {
    return this.options(i).map(o => [o, this.fillInBlank(i, o)])
  }
  quotation() {
    return this.selections.map((t, i) => this.fillInBlank(i, t)).join('')
  }
}

class TrigramSelectionView {
  constructor (model, i) {
    this.model = model
    this.i = i
    this.$el = $('<select>').addClass('mono')
    this.$el.change(() => { this.model.select(this.i, this.$el.val()) })
  }
  render() {
    let opts = this.model.formattedOptions(this.i).map(([v,t]) => `<option value=${v}>${t}</option>`)
    this.$el.empty().append(opts).val(this.model.selection(this.i))
    return this
  }
}

class AnaquoteView {
  constructor (el) {
    this.$el = $(el)
    this.model = new Anaquote()
    this.$el.change(() => { this.renderSubviews() })
  }
  render() {
    this.buildSubviews()
    this.$el.empty().append(this.subviews.map(v => v.render().$el))
    return this
  }
  buildSubviews() {
    this.subviews = this.model.selections.map((t,i) => new TrigramSelectionView(this.model, i))
  }
  renderSubviews() {
    this.subviews.forEach(v => v.render())
  }
}
