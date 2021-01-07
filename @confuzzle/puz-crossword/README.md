# @confuzzle/puz-crossword

This package is for reading, writing, and parsing `.puz` format files. It contains a single class, `PuzCrossword`. For standalone reading or writing, see also:
* [`@confuzzle/readpuz`](https://www.npmjs.com/package/@confuzzle/readpuz)
* [`@confuzzle/writepuz`](https://www.npmjs.com/package/@confuzzle/writepuz)

## Methods

* `PuzCrossword.from(x)` - equivalent to `Buffer.from(x)`, reads `.puz` file from `x` and returns a new `PuzCrossword`.
* `toBytes()` - returns a `Uint8Array` containing this crossword in `.puz` binary format
* `toBuffer()` - returns a `Buffer` containing this crossword in `.puz` binary format

## Fields

`PuzCrossword` objects have the following fields as defined in the [.puz file format](https://github.com/rjkat/confuzzle/blob/master/puz.md). They are all strings unless otherwise specified.

* `title`
* `author`
* `copyright` 
* `note` 
* `width` - integer
* `height` - integer
* `clues` - array of strings
* `solution`
* `state`

In addition to these, there are the following fields:
* `hasState` - boolean indicating whether state is all blank squares
* `parsedClues` - array of parsed clue objects

There is no clue numbering explicitly encoded in the `.puz` file format, so parsed clues are provided as a convenience. Here is an example of a parsed clue object.

```js
{
  number: 42,
  text: 'The ultimate question',
  solution: 'GFOPIOFJ',
  state: '--------',
  row: 9,
  col: 0,
  isAcross: true,
  length: 8
}
```

## Example Usage

```js
const PuzCrossword = require('@confuzzle/puz-crossword').PuzCrossword;
const fs = require('fs');
const cw = PuzCrossword.from(fs.readFileSync("test.puz"));
cw.title = "A new title"
const cw2 = PuzCrossword.from(cw.toBytes());
console.log(cw2.title)
```

## Limitations

The solution in the above clue is scrambled, unscrambling is not yet implemented. Other `.puz` features such as rebuses and timers have also not yet been implemented.
