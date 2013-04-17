var alphabet = function(rows) {
  this.rows = rows;
};

alphabet.prototype.at = function(row, idx) {
  if (row < 0 || row > 2)
    throw new Error("Alphabet row index out of bounds: " + row);
  return this.rows[row][idx];
};

var v1 = [
  "abcdefghijklmnopqrstuvwxyz",
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  " 0123456789.,!?_#'\"/\\<-:()"
];

var v2 = [
  "abcdefghijklmnopqrstuvwxyz",
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  " \n0123456789.,!?_#'\"/\\-:()"
];

alphabet.v1 = new alphabet(v1);
alphabet.v2 = new alphabet(v2);
alphabet.v3 = new alphabet(v2); // intentional.

module.exports = alphabet
