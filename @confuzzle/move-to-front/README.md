# @confuzzle/move-to-front

This package contains a naive, inefficient implementation of the [Move-to-front transform](https://en.wikipedia.org/wiki/Move-to-front_transform).

For details of how this can be used together with the
[Burrows-Wheeler transform](https://en.wikipedia.org/wiki/Burrows%E2%80%93Wheeler_transform)
to improve compression, see [this excellent blog post by Tommy Reddad](https://reddad.ca/2019/08/08/burrows-wheeler/).

## See also

- [@confuzzle/burrows-wheeler](https://www.npmjs.com/package/@confuzzle/burrows-wheeler) - naive Burrows-Wheeler transform implementation
- [@thi.ng/range-coder](https://www.npmjs.com/package/@thi.ng/range-coder) - useful for compressing the transformed result

## Functionality

This package provides two functions:
   - `forward(s)`, which runs `Buffer.from(s)` and performs the forward transform on the result
   - `inverse(x)`, which runs `Buffer.from(x)` performs the inverse transform on the result
Both functions return a `Buffer` object.

## Example Usage

```js
const mtf = require('@confuzzle/move-to-front');
const s = 'abracadabra';
const t = mtf.forward(s);
const inv = mtf.inverse(t).toString();
console.log(inv) // abracadabra
```