const fs = require('fs');
const path = require('path');
import {ShareablePuz} from '../client/js/shareable-puz.js';
const confuz = require('../client/js/confuz.js');
const emoji = require('../client/js/emoji.js');

const TEST_PUZ_FILE = path.join(__dirname, 'puzfiles', 'nyt_weekday_with_notes.puz')
const TEST_PUZ = ShareablePuz.from(fs.readFileSync(TEST_PUZ_FILE));

import {forward_bwt, inverse_bwt} from '../client/js/bwt.js'
import {forward_mtf, inverse_mtf} from '../client/js/mtf.js'

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
    const bwt = forward_bwt(Buffer.from(s));
    const inv = inverse_bwt(bwt).toString();
    expect(inv).toBe(s);
});

test('bwt_puz', () => {
    const puzbytes = TEST_PUZ.toBytes();
    const puzbuf = Buffer.from(puzbytes);
    const bwt = forward_bwt(puzbytes);
    const inv = inverse_bwt(bwt);
    expect(inv.equals(puzbuf)).toBe(true);
});

test('mtf', () => {
    const s = 'abracadabra';
    const mtf = forward_mtf(Buffer.from(s));
    const inv = inverse_mtf(mtf).toString();
    expect(inv).toBe(s);
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
