# anagrind

## Disclaimer
- this is still a work in progress, see below

## Known issues
- in multiplayer mode, sometimes the socket connection times out. no notification is provided to the user.
- when clicking "share", all the answers in the grid are lost
- more than 7 simultaneous solvers breaks everything
- changing the size of the grid in editing mode breaks things

## Features that would be good
### Solving
- screen reader/accessibility support
- hints
- checking for correct solution
- timer
- anagram exploder
- ability to toggle tooltip in grid

### Compiling
- ability to scramble answers automatically
- better system for laying out the grid
- eno file upload/download
- better syntax guide

## Features that are out of scope
- chat (moderation is hard)
- saved crosswords (copyright is hard)
- user accounts (I don't want your information)

## Attributions
* The creation of this software would not be possible without the work of others. See [this file](licenses/README.md) for the full list. In particular I would like to acknowledge:
    - [eno](https://eno-lang.org/about) - Simon Repp
    - [libpuz](https://github.com/ccasin/hpuz/tree/master/contrib/libpuz) - Chris Casinghino and Josh Myer
    - [the Financial Times interactive crossword](https://labs.ft.com/experiment/2018/03/23/crosswords.html) which was the inspiration for this project - the FT labs team

* Please also contact me if I have incorrectly attributed your work or am not abiding by license terms - it's certainly not my intent.
