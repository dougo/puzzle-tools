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
  return $('<select>').append(['___', ...trigrams].map(t => '<option>' + t))
}

function setTrigrams($el, trigrams) {
  $el.empty().append(trigrams.map(t => trigramSelect(trigrams)))
}
