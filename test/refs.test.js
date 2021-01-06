const fs = require('fs');
const path = require('path');
const parser = require('../client/js/parser.js');
const confuz = require('../client/js/confuz.js');

test('references', () => {
    const crossword = `
# meta
name: Reference test
author: RK

# grid
width: 5
height: 5

# clues

## 1A
row: 1
col: 1
ans: ONE
text: Across
lengths:
    - 3

## 2A
row: 3
col: 1
ans: TWO
lengths:
    - 3

## 3A
row: 5
col: 1
ans: THREE
lengths:
    - 5

## 1D
row: 1
col: 5
text: Down
ans: ONE
lengths:
    - 3

# references

## 1A
clues:
    - 1A
    - 2A
    - 3A

## 1D
clues:
    - 1D
    - 2A
    - 3A
`
    const cw = parser.parse(crossword);
    // console.log(JSON.stringify(cw.clues['1A']));
});
