function fillIn(enumeration, trigrams) {
  let text = trigrams.join('')
  return enumeration.split(/(\d+)/).map(token => {
    let len = Number.parseInt(token)
    if (isNaN(len)) return token
    let word = text.substr(0, len)
    text = text.substr(len)
    return word
  }).join('')
}

function trigramSelect(trigrams) {
  return $('<select>').addClass('mono').append(['___', ...trigrams].map(t => `<option>${t}</option>`))
}

function setTrigrams($el, trigrams) {
  let $selects = $el.empty().append(trigrams.map(t => trigramSelect(trigrams))).children()
  $selects.change(function () {
    let trigram = this.value
    let prev = $(this).data('prev')
    if (prev && prev !== '___')
      $selects.not(this).append(`<option>${prev}</option>`)
    if (trigram !== '___')
      $selects.not(this).find('option').filter((i,o) => o.value === trigram).remove()
    $(this).data('prev', trigram)
  })
}
