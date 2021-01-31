const fs = require('fs');
const path = require('path');
const parser = require('../@confuzzle/confuz-parser/parser');
const confuz = require('../@confuzzle/confuz-crossword/confuz');

test('references', () => {
    const crossword = `
# meta
name: Reference test
author: RK

# grid
width: 7
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
text: See 1A
lengths:
    - 3

## 3A
row: 5
col: 1
ans: THREE
text: See 1A
lengths:
    - 5

## 1D
row: 1
col: 5
text: Down
ans: ONE
lengths:
    - 3
    
## 3D
row: 1
col: 7
ans: THREE
text: See 1D
lengths:
    - 5

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
    - 3D
`
    const cw = parser.parse(crossword);
    // console.log(JSON.stringify(cw.clues));
});
