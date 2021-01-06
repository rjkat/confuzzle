const fs = require('fs');
const path = require('path');
const PuzPayload = require('../client/js/puz.js').PuzPayload;
const confuz = require('../client/js/confuz.js');

const emoji = require('../client/js/emoji.js');

const TEST_PUZ_FILE = path.join(__dirname, 'puzfiles', 'nyt_weekday_with_notes.puz')
const TEST_PUZ = PuzPayload.from(fs.readFileSync(TEST_PUZ_FILE));

import {forward_bwt, inverse_bwt} from '../client/js/bwt.js'
import {forward_mtf, inverse_mtf} from '../client/js/mtf.js'

test('eno conversion', () => {
    const eno = confuz.fromPuz(TEST_PUZ);
    const puz = confuz.toPuz(eno);
    const puzbytes = puz.toBytes();
    expect(puz.clueStrings[0]).toBe(TEST_PUZ.clueStrings[0]);
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
    const puz2 = PuzPayload.fromCompressed(puzbytes);
    expect(puz2.author).toBe(puz.author);
    const strippedBytes = puz.toCompressed(true);
    const puz3 = PuzPayload.fromCompressed(strippedBytes, true);
    expect(puz3.author).toBe(puz.author);
});
