class Anaquote {
  get trigrams () {
    return this._trigrams
  }
  set trigrams (trigrams) {
    this._trigrams = trigrams
    this.selections = trigrams.map(t => '___')
  }
  options(i) {
    return ['___', ...this.trigrams]
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
    this.el = el
    this.model = new Anaquote()
  }
  get el ()   { return this._el }
  set el (el) { this._el = el; this._$el = $(el) }
  get $el ()  { return this._$el }
  buildSelect() {
    return $('<select>').addClass('mono').append(this.model.options(0).map(t => `<option>${t}</option>`))
  }
  render() {
    this.$el.empty().append(this.model.trigrams.map(t => this.buildSelect()))
    let $selects = this.$el.children()
    $selects.change(function () {
      let trigram = this.value
      let prev = $(this).data('prev')
      if (prev && prev !== '___')
        $selects.not(this).append(`<option>${prev}</option>`)
      if (trigram !== '___')
        $selects.not(this).find('option').filter((i,o) => o.value === trigram).remove()
      $(this).data('prev', trigram)
    })
    return this
  }
}
