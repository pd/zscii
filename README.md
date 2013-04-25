# zscii
[![Build Status](https://travis-ci.org/pd/zscii.png?branch=master)](https://travis-ci.org/pd/zscii)

ZSCII-encoded string utilities.

Say it with me: "xyzzy".

See [the spec](http://www.gnelson.demon.co.uk/zspec/sect03.html).

## Installation

~~~~ console
$ npm install zscii
~~~~

## API
Something like:

~~~~ js
var zscii = require('zscii');
var coder = new zscii.coder(zscii.alphabetForVersion(3), abbrevs);
coder.decode([0x10af, 0x3ead]) //=> "mailbox"
zstr = coder.encode("mailbox") //=> zstring([0x10af, 0x3ead])
zstr.zchars() //=> [24, 6, ...]
~~~~

## License

  MIT
