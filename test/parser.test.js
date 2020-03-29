// const fs = require('fs');
// const path = require('path');
// const source = path.join(__dirname, 'crosswords', 'smh-cryptic-2003-10-10-fri.eno');
// const crossword = fs.readFileSync(source, 'utf-8');

const parser = require('../client/js/parser.js');
const crossword = parser.sampleCrossword();

test('basic parsing', () => {
  const cw = parser.parse(crossword);
  expect(cw.meta.author).toBe('DA');
});
