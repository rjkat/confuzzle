# @confuzzle/ecoji-buffers

Encode and decode arbitrary data as emoji. Since it uses [ecoji-js](https://www.npmjs.com/package/ecoji-js) under the hood it may be compatible with the [ecoji standard](https://github.com/keith-turner/ecoji), but has not been tested for this.

Huge thanks are owed to the following authors whose work is used in this package under license:
* Keith Turner - [ecoji standard](https://github.com/keith-turner/ecoji)
* Dmytro Borysovskyi - [ecoji-js](https://www.npmjs.com/package/ecoji-js)
* Ryan Shea - [emojicoding](https://www.npmjs.com/package/emojicoding)

This package differs from the packages above in that it operates with buffers.
[ecoji-js](https://www.npmjs.com/package/ecoji-js) only accepts and produces strings, so is less convenient for arbitrary binary data. [emojicoding](https://www.npmjs.com/package/emojicoding) accepts only arrays of emoji to decode, meaning strings need to be split into emoji (non-trivial). See [grapheme-splitter](https://www.npmjs.com/package/grapheme-splitter) for a possible way to do this. 

`ecoji-buffers` also differs from these packages in that it is a standalone package with no dependencies.

## Functions

* `encode(x)` - encodes a `Uint8Array` or `Buffer` as an emoji string
* `decode(x)` - decodes an emoji string to a `Buffer`

## Example Usage

```js
const ecoji = require('@confuzzle/ecoji-buffers');
const x = Buffer.from('Hello world');
const y = ecoji.encode(x);
console.log(y); // 🏯🔩🚗🌷🍉🤣🦒🕊👡
const z = ecoji.decode(y).toString();
console.log(z); // Hello world
```

## Limitations

This package has not been optimised for performance in any way, and has not been extensively tested. Use at your own risk.
