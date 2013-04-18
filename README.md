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
Possibly:

~~~~ js
var zscii = require('zscii');
var coder = new zscii.coder(zscii.Alphabet.v3, new ztables.Abbrev())
coder.decode(buffer)    //=> "mailbox"
coder.encode("mailbox") //=> <Buffer ...>
~~~~

But not yet. I need to spend some time determining how I can work with
Buffers in both node and the browser before I commit to a particular
interface.

## License

  MIT
