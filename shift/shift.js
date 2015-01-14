var A = 'A'.charCodeAt(0);
var Z = 'Z'.charCodeAt(0);
var a = 'a'.charCodeAt(0);
var z = 'z'.charCodeAt(0);


var distribution = null;
$.getJSON("distribution/trigrams.json").done(function(d){
  window.distribution = d;
});


function scoreString(s){
  s = s.replace(/\s+/g, ""); 
  if (distribution ==- null  || s.length < 3){
    return null;
  }

  var N = 3; // use trigrams

  var scores = toNgrams(s, N).map(scoreNgram);
  var raw = scores.reduce(sum);
  var penaltyAmount = distribution['ING']; // common trigram for big penalty
  var penalty = scores.filter(isCrappy).length * penaltyAmount;

  return raw - penalty;
}

function sum(v,n){return v+n;}

function isCrappy(t){
  return t < distribution['EVV']; // uncommon trigram as reference point for crappiness
}

function toNgrams(s, N){
  return range(s.length)
  .slice(0,-N+1)
  .map(function(i){return s.slice(i, i+3);});
}

function scoreNgram(ng){
  return distribution[ng.toUpperCase()] || 0;
}

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

function renderCell($row, content) {
  $('<td>').html(content).appendTo($row);
}

function renderRow($table, input, scored, reversed, doubled) {
  var shifted = input.shifted,
  score = input.score,
  i = input.i;

  var $row = $('<tr>').appendTo($table);
  if (doubled) shifted += shifted;
  if (reversed) {
    var reversed = shifted.split('').reverse().join('');
    renderCell($row, reversed);
  }
  if (scored && input.max && input.shifted.length > 4){
    $row.addClass("max-probability");
  } else {
    console.log("Non max", scored, input);
  }

  renderCell($row, i);
  renderCell($row, shifted);
}


function range(a, b){
  if (arguments.length == 1){
    b = a-1;
    a = 0;
  }

  var ret = [];
  for (var i=a; i<=b; i++){
    ret.push(i) 
  }
  return ret;
}

function assignMax(shifts){
  var maxScore = Math.max.apply(null, shifts.map(function(s){return s.score}));
  var threshold = maxScore - 0.5 * Math.abs(maxScore);
  shifts.forEach(function(s){
    if (s.score >= threshold){
      s.max = true;
    }
  });
}

function render($plaintext, $table) {
  $table.empty();
  var plaintext = $plaintext.focus().val();
  if (plaintext.length === 0) return;
  var reversed = $('#reverse').prop('checked');
  var doubled  = $('#double').prop('checked');
  var scored  = $('#score').prop('checked');

  var shifts = range(1, 26)
  .map(function(i){
    var shifted = shift(plaintext, i);
    return {
      i: i,
      shifted: shifted,
      score: scoreString(shifted),
      max: false
    };
  });

  assignMax(shifts);
  shifts.forEach(function(shift, i){
    renderRow($table, shift, scored, reversed, doubled);
  });

}

function main() {
  var $plaintext = $('#plaintext').focus();
  var $table = $('table');
  $('input').on('input change', function () { render($plaintext, $table); });
}

$(main);
