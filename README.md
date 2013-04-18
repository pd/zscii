# zscii
ZSCII-encoded string utilities.

Say it with me: "xyzzy".

See [the spec](http://www.gnelson.demon.co.uk/zspec/sect03.html).

## Installation

~~~~ console
$ npm install zscii
~~~~

## API

~~~~ js
var zscii = require('zscii');
var coder = new zscii.coder(zscii.Alphabet.v3, new ztables.Abbrev())
coder.decode(buffer)    //=> "mailbox"
coder.encode("mailbox") //=> <Buffer ...>
~~~~

## License

  MIT
