const fs = require('fs');
const path = require('path');
const ShareablePuz = require('../@confuzzle/puz-sharing').ShareablePuz;
const confuz = require('../client/js/confuz.js');

const TEST_PUZ_FILE = path.join(__dirname, 'puzfiles', 'nyt_weekday_with_notes.puz')
const TEST_PUZ = ShareablePuz.from(fs.readFileSync(TEST_PUZ_FILE));

const bwt = require('../@confuzzle/puz-sharing/transforms/bwt');
const mtf = require('../@confuzzle/puz-sharing/transforms/mtf');

const ecoji = require('@confuzzle/ecoji-buffers');
const rc = require('@thi.ng/range-coder');

test('eno conversion', () => {
    const eno = confuz.fromPuz(TEST_PUZ);
    const puz = confuz.toPuz(eno);
    const puzbytes = puz.toBytes();
    // console.log(puz.clues);
    // console.log(TEST_PUZ.clues);
    expect(puz.clues[0]).toBe(TEST_PUZ.clues[0]);
});

test('bwt', () => {
    const s = 'abracadabra';
    const t = bwt.forward(Buffer.from(s));
    const inv = bwt.inverse(t).toString();
    expect(inv).toBe(s);
});

test('bwt_puz', () => {
    const puzbytes = TEST_PUZ.toBytes();
    const puzbuf = Buffer.from(puzbytes);
    const t = bwt.forward(puzbytes);
    const inv = bwt.inverse(t);
    expect(inv.equals(puzbuf)).toBe(true);
});

test('mtf', () => {
    // const s = 'abracadabra';
    const s = Buffer.from([79,0,10,56,115,108,100,63,121,63]);
    const t = mtf.forward(Buffer.from(s));
    const inv = mtf.inverse(t);
    expect(inv.equals(s)).toBe(true);
});

test('compression', () => {
    const puz = TEST_PUZ;
    const puzbytes = puz.toCompressed();
    const puz2 = ShareablePuz.fromCompressed(puzbytes);
    expect(puz2.author).toBe(puz.author);
    const strippedBytes = puz.toCompressed(true);
    const puz3 = ShareablePuz.fromCompressed(strippedBytes, true);
    expect(puz3.author).toBe(puz.author);
});

test('emoji', () => {
    const puz = TEST_PUZ;
    const emoji = puz.toEmoji();
    const puz2 = ShareablePuz.fromEmoji(emoji);
    expect(puz2.author).toBe(puz.author);
});

test('ecoji text', () => {
    const x = Buffer.from('Hello world');
    const emoji = ecoji.encode(x);
    const y = ecoji.decode(emoji).toString();
    expect(y).toBe('Hello world');
})

