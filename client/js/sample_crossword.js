
export function sampleCrossword() {
  return `> this is an example crossword spec
> it is written in eno: https://eno-lang.org/eno
> comments start with ">"

> metadata section - all below fields mandatory
# meta
name: Example crossword
author: RK
pubdate: 2020/04/07
copyright: RK

> grid information - height and width are mandatory 
# grid
width: 15
height: 15

> planned extensions:
> - marked squares
> - author note/meta clue

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
> - marked clues
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