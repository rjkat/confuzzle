# @confuzzle/confuz-crossword

This package is for converting to and from `.confuz` format. For a parser to
convert this format into a usable object, see [`@confuzzle/confuz-parser`](https://www.npmjs.com/package/@confuzzle/confuz-parser).


## Methods

* `compressURL(x)` - convert `x` from `.confuz` to a format suitable for URLs, 
* `decompressURL(x)` - convert from compressed URL format to a `.confuz` formatted string
* `fromCrossword(crossword, options)` - returns a `.confuz` formatted string representing the object as returned by `@confuzzle/confuz-parser`. If `options.scramble` is `true`, apply `base64` scrambling of answers.
* `fromPuz(x)` - returns a `.confuz` formatted string representing `x` where `x` is in `.puz` binary format
* `toPuz(s)` - returns a `ShareablePuz` from a `.confuz` formatted string `s`. See [`@confuzzle/puz-sharing`](https://www.npmjs.com/package/@confuzzle/puz-sharing).

In the above methods, `x` is anything compatible with `Buffer.from()`.
