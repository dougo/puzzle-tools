var A = 'A'.charCodeAt(0);
var Z = 'Z'.charCodeAt(0);
var a = 'a'.charCodeAt(0);
var z = 'z'.charCodeAt(0);

function shiftLetter(letter, n) {
  var code = letter.charCodeAt(0);
  var base;
  if (code >= A && code <= Z) base = A;
  if (code >= a && code <= z) base = a;
  return base ? String.fromCharCode((code - base + n) % 26 + base) : letter;
}

function shift(plaintext, n) {
  return plaintext.split('').map(function (letter) { return shiftLetter(letter, n); }).join('');
}

function renderRow($table, i, shifted, reversed, doubled) {
  var $row = $('<tr>').appendTo($table);
  if (doubled) shifted += shifted;
  if (reversed) {
    var reversed = shifted.split('').reverse().join('');
    $('<td>').html(reversed).appendTo($row);
  }
  $('<td>').html(i).appendTo($row);
  $('<td>').html(shifted).appendTo($row);
}

function render($plaintext, $table) {
  $table.empty();
  var plaintext = $plaintext.focus().val();
  if (plaintext.length === 0) return;
  var reversed = $('#reverse').prop('checked');
  var doubled  = $('#double').prop('checked');
  for (var i = 1; i <= 26; i++) {
    renderRow($table, i, shift(plaintext, i), reversed, doubled);
  }
}

function main() {
  var $plaintext = $('#plaintext').focus();
  var $table = $('table');
  $('input').on('input change', function () { render($plaintext, $table); });
}

$(main);
