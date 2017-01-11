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

class AnaquoteView {
  constructor (el) {
    this.$el = $(el)
    this.model = new Anaquote()
  }
  buildSelect(i) {
    let opts = this.model.options(i).map(t => `<option>${t}</option>`)
    // TODO: make a SelectionView
    return $('<select>').addClass('mono').append(opts).val(this.model.selection(i)).data('i', i)
  }
  render() {
    this.$el.empty().append(this.model.trigrams.map((t,i) => this.buildSelect(i)))
    let $selects = this.$el.children()
    $selects.change(evt => {
      let trigram = evt.target.value
      this.model.select($(evt.target).data('i'), trigram)
      // TODO: render when the model changes, not here
      this.render()
    })
    return this
  }
}
