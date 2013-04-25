/**
 * The `zscii` package provides rudimentary support for encoding and decoding
 * of ZSCII strings (Z-Strings).
 *
 * @module zscii
 * @see http://www.gnelson.demon.co.uk/zspec/sect03.html
 */
module.exports = {
  zstring:  zstring,
  alphabet: alphabet,
  coder:    coder,

  /**
   * @static
   * @param {zchar[]} zchars An array of Z-characters
   * @return {word[]} The given zchars, packed into words.
   */
  pack: function(zchars) {
    if (!zchars.every(function(i) { return i >= 0 && i <= 31; }))
      throw new RangeError("zchars must be 1 <= c <= 31");

    var words = [];
    for (var i = 0, n = zchars.length; i < n; i += 3) {
      var slice = zchars.slice(i, i + 3);
      var c0 = slice[0] == null ? 5 : slice[0],
          c1 = slice[1] == null ? 5 : slice[1],
          c2 = slice[2] == null ? 5 : slice[2];
      words.push((c0 << 10) | (c1 << 5) | c2);
    }
    return words;
  },

  /**
   * @static
   * @param {Number} version A Z-Machine version number
   * @returns {zscii.alphabet} A default alphabet suitable for the
   *   given version number.
   */
  alphabetForVersion: function(version) {
    if (version < 1 || version > 8)
      throw new RangeError("Version must be 1..8");

    return new alphabet(
      "abcdefghijklmnopqrstuvwxyz",
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      version === 1 ?
        " 0123456789.,!?_#'\"/\\<-:()" :
        " \n0123456789.,!?_#'\"/\\-:()"
    );
  }
};

/**
 * A Z-String in memory is a sequence of 2-byte words, each containing
 * three zchars. A Z-String ends with a word which has its 0 bit set;
 * this constructor can be given an arbitrarily large sequence of words,
 * but will consider its contents to terminate at the correct location.
 *
 * @constructor
 * @param {word[]} words Array of ZSCII-encoded words
 * @see http://www.gnelson.demon.co.uk/zspec/sect03.html
 */
function zstring(words) {
  this.words = [];
  for (var i = 0, n = words.length; i < n; i++) {
    this.words.push(words[i]);
    if ((words[i] & 0x8000) !== 0)
      break;
  }
}

zstring.prototype = {
  /**
   * @returns {Number} The length of this zstring in bytes.
   */
  get byteLength() { return this.words.length * 2; }
};

/**
 * @return {zchar[]} An array of z-characters, which are 5-bit
 *   values.
 */
zstring.prototype.zchars = function() {
  return this.words.reduce(function(acc, word) {
    return acc.concat([
      (word >> 10) & 0x1f,
      (word >> 5)  & 0x1f,
      word & 0x1f
    ]);
  }, []);
};

/**
 * @constructor
 * @param {String} a0 The 26 characters used for alphabet row 'A0'
 * @param {String} a1 The 26 characters used for alphabet row 'A1'
 * @param {String} a2 The 26 characters used for alphabet row 'A2'
 * @throws {TypeError} If any of the rows are not exactly 26 characters.
 */
function alphabet(a0, a1, a2) {
  if (a0.length !== 26 || a1.length !== 26 || a2.length !== 26)
    throw new TypeError("Alphabets must be constructed with 3 strings of exactly 26 characters.");
  this.rows = [a0, a1, a2];
}

/**
 * @param {Number} row
 * @param {Number} idx
 * @returns {String} The character at the given alphabet position
 * @throws {RangeError} if `row` or `idx` are out of range.
 */
alphabet.prototype.get = function(row, idx) {
  if (row < 0 || row > 2)
    throw new RangeError("Bad row: " + row);
  if (idx < 0 || idx > 25)
    throw new RangeError("Bad idx: " + idx);
  return this.rows[row][idx];
};

/**
 * A ZSCII encoder and decoder.
 *
 * @constructor
 * @param {zscii.alphabet} alphabet The alphabet in use.
 * @param {Object} [abbrevs] A Z-Machine abbreviations table;
 *   the `zmachine` package provides a full-featured version, but the
 *   object needs only to respond to `get(n)` with the string at
 *   table entry `n`.
 */
function coder(alphabet, abbrevs) {
  this.alphabet = alphabet;
  this.abbrevs  = abbrevs;

  if (typeof alphabet === 'undefined' || typeof alphabet.get !== 'function')
    throw new TypeError('Alphabet must respond to get');
}

/**
 * @param {zstring|word[]} encoded The encoded value to decode
 * @param {abbrevs} [abbrevs] The abbreviation table to use; if not
 *   provided, the instance on the `abbrevs` property will be used;
 *   if that is also unset, and an abbreviation is required, an
 *   Error will be thrown.
 * @returns {String} The decoded String
 * @throws {Error} If an abbreviation must be expanded to decode this
 *   Z-String, but an abbreviation table was not provided to the
 *   function and was not already available on the object.
 */
coder.prototype.decode = function(encoded, abbrevs) {
  if (typeof encoded.zchars !== 'function')
    encoded = new zstring(encoded);
  if (typeof abbrevs === 'undefined')
    abbrevs = this.abbrevs;

  var ctx = new context(this.alphabet, abbrevs);
  encoded.zchars().forEach(function(zchar) {
    ctx.consume(zchar);
  });

  return ctx.string;
};

/**
 * @class
 * @private
 */
function context(alphabet, abbrevs) {
  this.alphabet  = alphabet;
  this.abbrevs   = abbrevs;
  this.state     = 'base';
  this.string    = '';
  this.shiftedTo = 0;
}

context.prototype = {
  consume: function(c) {
    zcharConsumers[this.state].call(null, this, c);
  },

  consumeAs: function(state, c) {
    zcharConsumers[state].call(null, this, c);
  },

  append: function(s) {
    this.string += s;
  },

  shiftTo: function(alphabetIndex) {
    this.state = 'shift';
    this.shiftedTo = alphabetIndex;
  },

  unshift: function() {
    this.state = 'base';
    this.shiftedTo = 0;
  },

  abbreviating: function(table) {
    if (table === 1 || table === 2 || table === 3) {
      this.state = 'abbrev';
      this.targetAbbrevTable = table;
    } else {
      this.state = 'base';
      this.targetAbbrevTable = undefined;
    }
  },

  tenBitMode: function(on) {
    if (on === true) {
      this.state  = 'tenBit';
      this.tenBit = true;
    } else {
      this.state  = 'base';
      this.tenBit = undefined;
    }
  }
};

var zcharConsumers = {
  base: function(context, c) {
    if (c === 0)
      context.append(' ');
    else if (c === 1 || c === 2 || c === 3)
      context.abbreviating(c);
    else if (c === 4)
      context.shiftTo(1);
    else if (c === 5)
      context.shiftTo(2);
    else
      context.append(context.alphabet.get(context.shiftedTo, c - 6));
  },

  shift: function(context, c) {
    if (context.shiftedTo === 2 && c === 6) {
      context.unshift();
      context.tenBitMode(true);
    } else {
      context.consumeAs('base', c);
      context.unshift();
    }
  },

  abbrev: function(context, c) {
    var index = 32 * (context.targetAbbrevTable - 1) + c;
    if (typeof context.abbrevs === 'undefined')
      throw new Error("Abbreviation requested, but no abbrevs table available.");
    context.append(context.abbrevs.get(index));
    context.abbreviating(false);
  },

  tenBit: function(context, c) {
    if (context.tenBit === true)
      context.tenBit  = c << 5;
    else {
      context.tenBit |= c;
      if (context.tenBit >= 32 && context.tenBit <= 126)
        context.append(String.fromCharCode(context.tenBit));
      context.tenBitMode(false);
    }
  }
};
