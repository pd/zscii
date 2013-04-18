var context = require('./lib/reader-context');

var reader = function(alphabet, abbrevs) {
  this.alphabet = alphabet;
  this.abbrevs  = abbrevs;
};

reader.prototype.charStream = function(words) {
  return words.reduce(function(acc, word) {
    return acc.concat([
      (word >> 10) & 0x1f,
      (word >> 5)  & 0x1f,
      word & 0x1f
    ]);
  }, []);
};

reader.prototype.decodeString = function(words) {
  var ctx    = new context(this.alphabet, this.abbrevs),
      zchars = this.charStream(words);

  zchars.forEach(function(zchar) {
    ctx.consume(zchar);
  });

  return ctx.string;
};

module.exports = {
  abbrevs:  require('./lib/abbrevs'), // TODO extract to ztables
  alphabet: require('./lib/alphabet'),
  reader:   reader
};
