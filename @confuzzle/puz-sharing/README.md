# @confuzzle/puz-sharing

This package extends [`@confuzzle/puz-crossword`](https://www.npmjs.com/package/@confuzzle/puz-crossword), adding capabilities for compressing and converting `.puz` files to URL-compatible `base64` and emoji. The compressed format should be treated as experimental and will not be backwards-compatible betweeen releases of this package at this stage.

This package makes use of [`@thi.ng/range-coder`](https://www.npmjs.com/package/@thi.ng/range-coder) by Karsten Schmidt, part of the excellent [`@thi.ng umbrella library`](https://github.com/thi-ng/umbrella).

## Contents

This package provides a single class, `ShareablePuz`, which extends `PuzCrossword` with the following additional methods:
* `ShareablePuz.toCompressed()` - return a compressed representation of the crossword as raw bytes
* `ShareablePuz.toEmoji()` - the compressed representation encoded using [`@confuzzle/ecoji-buffers`](https://www.npmjs.com/package/@confuzzle/ecoji-buffers)
* `ShareablePuz.toURL()` - the compressed representation encoded using [`@base64url`](https://www.npmjs.com/package/@base64url)

Each of these methods has a counterpart returning a new `ShareablePuz` object from its output `x`:
* `ShareablePuz.fromCompressed(x)`
* `ShareablePuz.fromEmoji(x)`
* `ShareablePuz.fromURL(x)`

## Example Usage

```js
const ShareablePuz = require('@confuzzle/puz-sharing').ShareablePuz;
const fs = require('fs');
const cw = ShareablePuz.from(fs.readFileSync("test.puz"));
console.log(cw.title) // Test puzzle
const emoji = cw.toEmoji();
console.log(emoji.slice(0, 10)) // 🧩✨0️⃣🌌🇩
const cw2 = ShareablePuz.fromEmoji(emoji);
console.log(cw2.title) // Test puzzle
```



