# @confuzzle/readpuz

This package is for reading `.puz` format files. For a full reader, writer, and parser, see [`@confuzzle/puz-crossword`](https://www.npmjs.com/package/@confuzzle/puz-crossword).

## Functionality

This package provides a single function `readpuz(x)`, which runs `Buffer.from(x)`, reads the `.puz` formatted contents of the buffer and returns an object according to the [.puz file format](https://github.com/rjkat/confuzzle/blob/master/puz.md) as follows:

```js
{
   title: "...",
   author: "...",
   copyright: "...",
   note: "...",
   width: 15,
   height: 15,
   clues: ["clue 1", "clue 2", ... ],
   solution: "ABC...",
   state: "A--...",
   hasState: true
}
```

`hasState` is a boolean indicating whether `state` is all blank squares (not part of the `.puz` format, provided for convenience).

## Example Usage

```js
const fs = require('fs');
const readpuz = require('@confuzzle/readpuz').readpuz;
const puz = readpuz(fs.readFileSync("test.puz"));
```