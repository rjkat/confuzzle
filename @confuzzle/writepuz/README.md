# @confuzzle/writepuz

This package is for writing `.puz` format files. For a full reader, writer, and parser, see [`@confuzzle/puz-crossword`](https://www.npmjs.com/package/@confuzzle/puz-crossword).

## Functionality

This package provides a single function `writepuz(puz)`, which takes a `puz` object (described below) and returns a Uint8Array of its corresponding `.puz` representation.

```js
const puz = {
   title: "...",
   author: "...",
   copyright: "...",
   note: "...",
   width: 15,
   height: 15,
   clues: ["clue 1", "clue 2", ...],
   solution: "ABC...",
   state: "A--..."
}
```

All fields have meanings as described by the [.puz file format](https://github.com/rjkat/confuzzle/blob/master/puz.md). The `state` field is optional.

## Example Usage

```js
const fs = require('fs');
const readpuz = require('@confuzzle/readpuz').readpuz;
const writepuz = require('@confuzzle/writepuz').writepuz;
const puz = readpuz(fs.readFileSync("test.puz"));
puz.title = "A new title";
const puzbytes = writepuz(puz);
const puz2 = readpuz(puzbytes);
console.log(puz2.title);
```