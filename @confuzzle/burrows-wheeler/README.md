# @confuzzle/burrows-wheeler

This package contains a naive, inefficient implementation of the [Burrows-Wheeler transform](https://en.wikipedia.org/wiki/Burrows%E2%80%93Wheeler_transform), which only works for input sizes of less than 64KiB.

For details for how this can be used together with the [Move-to-front transform](https://en.wikipedia.org/wiki/Move-to-front_transform) to improve compression, see [this excellent blog post by Tommy Reddad](https://reddad.ca/2019/08/08/burrows-wheeler/). Another resource that may be useful is this [previous assignment](https://www.cs.princeton.edu/courses/archive/spring03/cos226/assignments/burrows.html) set for the COS226 course at Princeton in 2003.

## See also

- [@confuzzle/move-to-front](https://www.npmjs.com/package/@confuzzle/burrows-wheeler) - naive Move-to-front transform implementation
- [@thi.ng/range-coder](https://www.npmjs.com/package/@thi.ng/range-coder) - useful for compressing the transformed result

## Functionality

This package provides two functions:
   - `forward(s)`, which runs `Buffer.from(s)` and performs the forward transform on the result
   - `inverse(x)`, which runs `Buffer.from(x)` performs the inverse transform on the result
Both functions return a `Buffer` object.

## Example Usage

```js
const bwt = require('@confuzzle/burrows-wheeler');
const s = 'abracadabra';
const t = bwt.forward(s);
const inv = bwt.inverse(t).toString();
console.log(inv) // abracadabra
```