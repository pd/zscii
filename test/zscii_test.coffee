expect = require('chai').expect
zscii  = require('../index')

describe 'Alphabets', ->
  it 'should know the v1 alphabet', ->
    v1 = zscii.alphabet.v1
    expect(v1).to.exist

  it 'should know the v2 alphabet', ->
    v2 = zscii.alphabet.v2
    expect(v2).to.exist

  it 'should know the v3 alphabet', ->
    v3 = zscii.alphabet.v3
    expect(v3).to.exist

describe 'String decoding', ->
  beforeEach ->
    @abbrevs = new zscii.abbrevs()
    @reader  = new zscii.reader(zscii.alphabet.v3, @abbrevs)

  it 'decodes within a single alphabet row', ->
    decoded = @reader.decodeString [0x65aa, 0x80a5]
    expect(decoded).to.equal 'the '

  it 'decodes across multiple alphabet rows', ->
    decoded = @reader.decodeString [0x132d, 0xa805]
    expect(decoded).to.equal 'The '

  it 'decodes larger words', ->
    decoded = @reader.decodeString [0x1353, 0x2e97, 0x6753, 0x1b2a, 0xc7c5]
    expect(decoded).to.equal 'Unfortunately'

  it 'decodes punctuation', ->
    decoded = @reader.decodeString [0x13d4, 0x68b8, 0xdd40]
    expect(decoded).to.equal "You're "

  it 'decodes ten-bit forms', ->
    decoded = @reader.decodeString [0x14c1, 0x936a]
    expect(decoded).to.equal '$ve'

  it 'produces no output for infinite shift characters', ->
    decoded = @reader.decodeString [0x14a5, 0x1484, 0x1084]
    expect(decoded).to.equal ''

  it 'can read words from the abbreviations table', ->
    @abbrevs.set(1, 10, 'oo')
    @abbrevs.set(2, 15, 'ar')
    @abbrevs.set(3, 20, 'ba')
    decoded = @reader.decodeString [0x2c2a, 0x1c4f, 0x0e9f, 0x00a5]
    expect(decoded).to.equal 'foobarbaz '
