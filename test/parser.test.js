const fs = require('fs');
const path = require('path');
const parser = require('../client/js/parser.js');
const crossword = parser.sampleCrossword();
const confuz = require('../client/js/confuz.js');
import {ShareablePuz} from '../client/js/shareable-puz.js';

test('basic parsing', () => {
  const cw = parser.parse(crossword);
  expect(cw.meta.author).toBe('RK');
});

test('scramble round trip', () => {
    const cw = parser.parse(crossword);
    const scrambled = confuz.fromCrossword(cw, {scramble: true});
    const parsed = parser.parse(scrambled);
    expect(parsed.meta.author).toBe('RK');
    const unscrambled = confuz.fromCrossword(parsed, {scramble: false});
    const parsed2 = parser.parse(unscrambled);
    expect(parsed2.meta.author).toBe('RK');
});


test('compression', () => {
    const source = path.join(__dirname, 'puzfiles', 'nyt_weekday_with_notes.puz');
    const buf = fs.readFileSync(source);
    const puz = ShareablePuz.from(buf);
    const eno = confuz.fromPuz(puz);
    const compressed = confuz.compressURL(eno);
    const parsed = parser.parse(confuz.decompressURL(compressed));
    expect(parsed.meta.author).toBe("Natan Last / Will Shortz");
});
