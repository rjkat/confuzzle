
const parser = require('../client/js/parser.js');
const crossword = parser.sampleCrossword();
const confuz = require('../client/js/confuz.js');

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
