// the interpretation of any given zchar depends upon the
// state produced by previous zchars. this object wraps that
// maintenance up tidily.

// I would prefer a minimalistic state machine here, but most
// of the libraries I found were way over the top for the
// tiny feature set I would actually require.

var context = function(alphabet, abbrevs) {
  this.alphabet  = alphabet;
  this.abbrevs   = abbrevs;
  this.state     = 'base';
  this.string    = '';
  this.shiftedTo = 0;
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
      context.append(context.alphabet.at(context.shiftedTo, c - 6));
  },

  shift: function(context, c) {
    if (c === 6) {
      context.unshift();
      context.tenBitMode(true);
    } else {
      context.consumeAs('base', c);
      context.unshift();
    }
  },

  abbrev: function(context, c) {
    context.append(context.abbrevs.get(context.targetAbbrevTable, c));
    context.abbreviating(false);
  },

  tenBit: function(context, c) {
    if (context.tenBit === true)
      context.tenBit  = c << 5;
    else {
      context.tenBit |= c;
      if (context.tenBit >= 32 && context.tenBit <= 126)
        context.append(String.fromCharCode(context.tenBit));
      else
        throw new Error("Non-ASCII ten-bit not yet implemented");
      context.tenBitMode(false);
    }
  }
};

context.prototype.consume = function(c) {
  zcharConsumers[this.state].call(null, this, c);
};

context.prototype.consumeAs = function(state, c) {
  zcharConsumers[state].call(null, this, c);
};

context.prototype.append = function(s) {
  this.string += s;
};

context.prototype.shiftTo = function(alphabetIndex) {
  this.state = 'shift';
  this.shiftedTo = alphabetIndex;
};

context.prototype.unshift = function() {
  this.state = 'base';
  this.shiftedTo = 0;
};

context.prototype.abbreviating = function(table) {
  if (table === 1 || table === 2 || table === 3) {
    this.state = 'abbrev';
    this.targetAbbrevTable = table;
  } else {
    this.state = 'base';
    this.targetAbbrevTable = undefined;
  }
};

context.prototype.tenBitMode = function(on) {
  if (on === true) {
    this.state  = 'tenBit';
    this.tenBit = true;
  } else {
    this.state  = 'base';
    this.tenBit = undefined;
  }
};

module.exports = context;
