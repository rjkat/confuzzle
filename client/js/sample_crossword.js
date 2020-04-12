
export function sampleCrossword() {
  return `> this is an example crossword spec
> it is written in eno: eno-lang.org/eno
> you may wish to edit in a text editor with support for
> eno syntax highlighting - see eno-lang.org/plugins
> comments start with ">"

> crossword metadata
# meta

> mandatory fields
name: Example crossword
author: RK

> optional fields

> type defaults to "cryptic" if not present
type: example
identifier: 2020/04/07
copyright: Please respect copyright when using this site
note: [ NB - this is an example crossword ]

> grid information
# grid

> height and width are mandatory 
width: 15
height: 15

> optional subsection for shading squares
## shading

> subsections of "shading" can take start/end coordinates
> or lists of clues
> subsection name is required but can be anything
### yellowclues
color: #fefc34
clues:
  - 1D

### scarletletter
color: #f00
startRow: 2
startCol: 6
endRow: 2
endCol: 6

> clue section - each clue is a subsection
# clues

> clue identifier 
> number: used to number cell
> A/D: denotes direction (A -> across, D -> down)
> out of order/duplicate numbers are allowed, but duplicate clue identifiers are not
## 1A

> clue coordinates (mandatory)
row: 2
col: 3

> clue text (mandatory)
text: Coarsen, so coarsely, this?

> lengths of each word in the clue (mandatory)
lengths:
    - 3
    - 6

> separators to denote word breaks (optional, defaults to ",")
separators:
    - -

> planned extensions:
> - clues that reference other clues
> - emphasis in clue text

## 1D
row: 7
col: 10
text: This - duck low, without any sound
lengths:
    - 3
    - 4
`;
}