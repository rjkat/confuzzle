# Confuzzle

[![Node.js CI](https://github.com/rjkat/confuzzle/actions/workflows/node.js.yml/badge.svg?branch=master)](https://github.com/rjkat/confuzzle/actions/workflows/node.js.yml) [![Fly Deploy](https://github.com/rjkat/confuzzle/actions/workflows/fly.yml/badge.svg?branch=master)](https://confuzzle.app)


## About

Solve crosswords with your friends! Confuzzle is an interactive crossword editor and real-time collaboration app which also works offline in standalone mode. [See it in action here](https://confuzzle.app).

## .puz file format utilities

As part of building this project I have made some nodejs packages for reading, writing, and parsing the .puz file format, the main one being [@confuzzle/puz-crossword](https://www.npmjs.com/package/@confuzzle/puz-crossword).

The best documentation I could find about this format was from [the libpuz wiki](https://code.google.com/archive/p/puz/wikis/FileFormat.wiki). I have converted this page to markdown at [puz.md](puz.md), since the original page has lost some of its formatting.

## Contributing

This is a hobby project which is slowly becoming more polished over time. Bug reports and feature requests are absolutely welcome. Pull requests are even better!

## Acknowledgements

The creation of this software would not be possible without the work of others. See [this file](licenses/README.md) for the full list. In particular I would like to acknowledge:
* [eno](https://eno-lang.org/#about) - Simon Repp
* [libpuz](https://github.com/ccasin/hpuz/tree/master/contrib/libpuz) - Chris Casinghino and Josh Myer
* [the Financial Times interactive crossword](https://labs.ft.com/experiment/2018/03/23/crosswords.html) which was the inspiration for this project - the FT labs team

Please also contact me if I have incorrectly attributed your work or am not abiding by license terms - it's certainly not my intent.
