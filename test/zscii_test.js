var assert = require('chai').assert,
    zscii  = require('..');

describe('zscii.alphabetForVersion', function() {
  it('returns the default alphabet for Z-Machine versions >= 2', function() {
    [2, 3, 4, 5, 6, 7, 8].forEach(function(version) {
      var alphabet = zscii.alphabetForVersion(version);
      assert.instanceOf(alphabet, zscii.alphabet);
      assert.strictEqual(alphabet.get(0, 0),  'a');
      assert.strictEqual(alphabet.get(2, 1),  "\n");
      assert.strictEqual(alphabet.get(2, 21), '\\');
    });
  });

  it('returns the alphabet unique to version 1 Z-Machines', function() {
    var alphabet = zscii.alphabetForVersion(1);
    assert.instanceOf(alphabet, zscii.alphabet);
    assert.strictEqual(alphabet.get(0, 0),  'a');
    assert.strictEqual(alphabet.get(2, 1),  '0');
    assert.strictEqual(alphabet.get(2, 21), '<');
  });

  it('throws RangeError on bogus versions', function() {
    [-1, 0, 9].forEach(function(version) {
      assert.throw(function() { zscii.alphabetForVersion(version); }, RangeError);
    });
  });
});

describe('zscii.alphabet', function() {
  it('throws TypeError if given anything but exactly 26 characters per row', function() {
    var good     = 'aaaaaaaaaaaaaaaaaaaaaaaaaa',
        tooLong  = 'aaaaaaaaaaaaaaaaaaaaaaaaaaa',
        tooShort = 'aaaaaaaaaaaaaaaaaaaaaaaaa';
    assert.throw(function() { new zscii.alphabet(good, good, tooLong)  }, TypeError);
    assert.throw(function() { new zscii.alphabet(good, tooShort, good) }, TypeError);
    assert.throw(function() { new zscii.alphabet(tooLong, good, good) }, TypeError);
  });
});

describe('zscii.pack', function() {
  var pack = zscii.pack;

  it('packs an array of zchars into an array of words', function() {
    assert.deepEqual(pack([]), []);
    assert.deepEqual(pack([7, 8, 9]), [0x1d09]);
  });

  it('pads to a multiple of 3 zchars as necessary, using 5s', function() {
    assert.deepEqual(pack([1]), [0x04a5]);
    assert.deepEqual(pack([7, 8, 9, 4, 10, 5]), [0x1d09, 0x1145]);
  });

  it('throws RangeError if given a zchar value outside the possible range', function() {
    assert.throw(function() { zscii.pack([-1]) }, RangeError);
    assert.throw(function() { zscii.pack([32]) }, RangeError);
    assert.doesNotThrow(function() { zscii.pack([0]) });
    assert.doesNotThrow(function() { zscii.pack([31]) });
  });
});

describe('zscii.zstring', function() {
  var zstring = zscii.zstring;

  it('unpacks the given words into zchars', function() {
    [ [1, 2, 3],
      [8, 9, 4, 7, 5, 5],
      [5, 5, 5]
    ].forEach(function(zchars) {
      var packed = zscii.pack(zchars);
      var zstr   = new zstring(packed);
      assert.deepEqual(zstr.zchars(), zchars);
    });
  });

  it('knows its own length in bytes', function() {
    assert.equal(new zstring([]).byteLength, 0);
    assert.equal(new zstring([0x01a1]).byteLength, 2);
    assert.equal(new zstring([0x01a1, 0x02b2]).byteLength, 4);
  });

  it('drops all words given after a word with its 0-bit set', function() {
    // zscii.pack([0, 1, 2, 3, 4, 5, 6, 7, 8]), set 0-bit on [3,4,5] word
    var packed = [0x0022, 0x8c85, 0x18e8];
    var zstr   = new zstring(packed);
    assert.equal(zstr.byteLength, 4);
    assert.deepEqual(zstr.zchars(), [0, 1, 2, 3, 4, 5]);
  });
});

describe('zscii.coder', function() {
  function MockAbbrevs() {
    var entries = {};
    return {
      get: function(n) { return entries[n]; },
      set: function(n, str) { entries[n] = str; }
    };
  }

  beforeEach(function() {
    this.alphabet = zscii.alphabetForVersion(3);
    this.abbrevs  = new MockAbbrevs();
  });

  it('throws TypeError if not given an alphabet', function() {
    assert.throw(function() { new zscii.coder(); }, TypeError);
  });

  it('throws TypeError if given a non-functional alphabet', function() {
    assert.throw(function() { new zscii.coder({}); }, TypeError);
  });

  it('can decode a zstring instance', function() {
    var zstr  = new zscii.zstring([0x65aa, 0x80a5]);
    var coder = new zscii.coder(this.alphabet);
    assert.strictEqual(coder.decode(zstr), 'the ');
  });

  it('can decode an array of words', function() {
    var coder = new zscii.coder(this.alphabet);
    assert.strictEqual(coder.decode([0x65aa, 0x80a5]), 'the ');
  });

  it('decodes abbreviation-free zstrings', function() {
    var coder = new zscii.coder(this.alphabet);
    assert.strictEqual(coder.decode([0x65aa, 0x80a5]), 'the ');
    assert.strictEqual(coder.decode([0x132d, 0xa805]), 'The ');
    assert.strictEqual(coder.decode([0x1353, 0x2e97, 0x6753, 0x1b2a, 0xc7c5]), 'Unfortunately');
    assert.strictEqual(coder.decode([0x13d4, 0x68b8, 0xdd40]), "You're ");
  });

  it('produces no output for infinite shift characters', function() {
    var coder = new zscii.coder(this.alphabet);
    assert.strictEqual(coder.decode([0x14a5, 0x1484, 0x1084]), '');
  });

  it('decodes tenBit forms that produce ASCII', function() {
    var coder = new zscii.coder(this.alphabet);
    assert.strictEqual(coder.decode([0x14c1, 0x936a]), '$ve');
  });

  it('can use non-default alphabets', function() {
    var alphabet = new zscii.alphabet(
      "aaaaaaaaaaaaaaaaaaaaaaaaaa",
      "BBBBBBBBBBBBBBBBBBBBBBBBBB",
      "cccccccccccccccccccccccccc"
    );

    var coder = new zscii.coder(alphabet);
    assert.strictEqual(coder.decode([0x1886, 0x14e5]), 'aBc');
  });

  context('abbreviations', function() {
    it('can use the table given at construction', function() {
      var coder  = new zscii.coder(this.alphabet, this.abbrevs);
      this.abbrevs.set(0, 'foo');
      assert.strictEqual(coder.decode(zscii.pack([1, 0])), 'foo');
    });

    it('favors a table given to decode()', function() {
      var coder   = new zscii.coder(this.alphabet, this.abbrevs);
      var abbrevs = new MockAbbrevs();
      this.abbrevs.set(0, 'foo');
      abbrevs.set(0, 'bar');
      assert.strictEqual(coder.decode(zscii.pack([1, 0]), abbrevs), 'bar');
    });

    it('throws if an abbreviation is needed, but no table is available', function() {
      var coder = new zscii.coder(this.alphabet);
      assert.throw(function() {
        coder.decode(zscii.pack([1, 0]));
      }, /abbrevs table/);
    });
  });
});
