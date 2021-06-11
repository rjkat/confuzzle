
function sampleCrossword() {
  return `> this is an example crossword in .confuz format
> it uses the eno language: eno-lang.org/eno
> you may wish to edit in a text editor with support for
> eno syntax highlighting - see eno-lang.org/plugins
> comments start with ">"

> crossword metadata
# meta

> mandatory fields
name: Example
author: RK

> optional fields

> type defaults to "cryptic" if not present
type: example
identifier: 2020/04/07
copyright: Please respect copyright when using this site

> a subset of HTML is supported for formatting
note: Select <i>Edit</i> from the menu above to edit this crossword (on a tablet or desktop).

> answer scrambling, can be anything, defaults to "none".
> "base64" is understood by the crossword engine.
scramble: none

> grid information
# grid

> height and width are mandatory 
width: 15
height: 15

> optional subsection for shading squares
## shading

> subsections of "shading" can have coordinates or lists of clues. 
> subsection name is required but can be anything.
### yellowclues
color: #fefc34
clues:
  - 1D
  - 2D

### scarletletter
color: #f00
row: 2
col: 6

> clue section - each clue is a subsection
# clues

> clue identifier 
> number: used to number cell
> A/D: denotes direction (A -> across, D -> down)
> out of order/duplicate numbers are allowed,
> use of duplicate clue identifiers is undefined
## 1A

> clue coordinates (mandatory)
row: 2
col: 3

> clue text (mandatory)
text: Coarsen, so coarsely, this?

> solution as shown in grid (optional, may be scrambled according to "scramble" field in metadata)
> will be automatically filled in when compiling if scramble is "none"
ans: ONEACROSS

> lengths of each word in the clue (mandatory)
lengths:
    - 3
    - 6

> separators to denote word breaks
> (optional, defaults to ",")
separators:
    - -


> custom numbering, of course you can have emoji 😉
### numbering
clue: ❤️ [1A]
grid: ❤️
offset: 6

## 1D
row: 7
col: 10
ans: ONE

text: ⬅️ duck low, without severed connection
lengths:
    - 3


## 2D
row: 7
col: 12
ans: TWODOWN
text: See 1D

> boolean, specifies that word lengths in brackets will not automatically be added
> when displaying the clue
verbatim

lengths:
    - 3
    - 4

> section describing clues which are spread across multiple grid slots
# references

> primary clue
## 1D

> grid slots in order
clues:
    - 1D
    - 2D

> word separators between grid slots.
> to split a single word across multiple slots, specify an empty list here.
separators:
    - /

> grid state of any partially filled answers (optional, as for .puz files)
> stripped at upload time (see syntax guide if missing)

# state

## 1A
ans: O--A-----

> bug reports and suggestions for new features are absolutely welcome:
> https://github.com/rjkat/confuzzle/issues/new

> happy compiling!
`;
}

module.exports = {
    sampleCrossword: sampleCrossword
}