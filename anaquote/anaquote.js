class Anaquote {
  get trigrams () {
    return this._trigrams
  }
  set trigrams (trigrams) {
    this._trigrams = trigrams
    this.selections = trigrams.map(t => '___')
  }
  options(i) {
    let otherSelections = new Set(this.selections)
    otherSelections.delete(this.selection(i))
    return ['___', ...this.trigrams.filter(t => !otherSelections.has(t))]
  }
  selection(i) {
    return this.selections[i]
  }
  select(i, trigram) {
    this.selections[i] = trigram
  }
  quotation() {
    let text = this.trigrams.join('')
    return this.enumeration.split(/(\d+)/).map(token => {
      let len = Number.parseInt(token)
      if (isNaN(len)) return token
      let word = text.substr(0, len)
      text = text.substr(len)
      return word
    }).join('')
  }
}

class TrigramSelectionView {
  constructor (model, i) {
    this.model = model
    this.i = i
    this.$el = $('<select>').addClass('mono')
  }
  render() {
    let opts = this.model.options(this.i).map(t => `<option>${t}</option>`)
    this.$el.empty().append(opts).val(this.model.selection(this.i))
    this.$el.change(() => { this.model.select(this.i, this.$el.val()) })
    return this
  }
}

class AnaquoteView {
  constructor (el) {
    this.$el = $(el)
    this.model = new Anaquote()
  }
  buildSubviews() {
    this.subviews = this.model.trigrams.map((t,i) => new TrigramSelectionView(this.model, i))
  }
  render() {
    this.buildSubviews()
    this.$el.empty().append(this.subviews.map(v => v.render().$el))
    this.$el.children().change(evt => {
      // TODO: render when the model changes, not here
      this.render()
    })
    return this
  }
}
