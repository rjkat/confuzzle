const parser = require('../client/js/parser.js');
const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, 'crosswords', 'smh-cryptic-2020-03-27-fri.eno');
const crossword = fs.readFileSync(source, 'utf-8');

test('basic parsing', () => {
  const cw = parser.parse(crossword, {source: source});
  expect(cw.author).toBe('DA');
});
