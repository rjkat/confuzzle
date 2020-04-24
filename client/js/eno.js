import {readPuz} from './puz.js';

const BLACK_SQUARE_CHAR = '.';

function isBlackSquare(grid, row, ncols, col) {
    return grid[row*ncols + col] === BLACK_SQUARE_CHAR;
}

function acrossLen(grid, row, ncols, col) {
    var pos = row * ncols + col;
    var len = 0;
    while (pos < (row + 1) * ncols) {
        if (grid[pos] == BLACK_SQUARE_CHAR) {
            break;
        }
        len++;
        pos++;
    }
    return len;
}

function downLen(grid, nrows, row, ncols, col) {
    var len = 0;
    var pos = row * ncols + col;
    while (pos < nrows * ncols) {
        if (grid[pos] == BLACK_SQUARE_CHAR) {
            break;
        }
        pos += ncols;
        len++;
    }
    return len;
}

function getClue(p, n) {
    const nrows = p.header.height;
    const ncols = p.header.width;
    const grid = p.solution;
    var row, col;
    var number = 1;
    var nclues = 0;
    var found = false;

    var clue = {};
    for (row = 0; row < nrows; row++) {
        for (col = 0; col < ncols; col++) {
            var numbered = false;
            var isAcrossSpace, isDownSpace;
            var isAcrossClue = false;
            var isDownClue = false;
            var nacross, ndown;
            if (isBlackSquare(grid, row, ncols, col)) {
                continue;
            }
            isAcrossSpace = col == 0 || isBlackSquare(grid, row, ncols, col - 1);
            nacross = acrossLen(grid, row, ncols, col);
            if (isAcrossSpace && nacross > 1) {
                numbered = true;
                isAcrossClue = true;
            }
            isDownSpace = row == 0 || isBlackSquare(grid, row - 1, ncols, col);
            ndown = downLen(grid, nrows, row, ncols, col);
            if (isDownSpace && ndown > 1) {
                numbered = true;
                isDownClue = true;
            }
            if (!numbered) {
                continue;
            }
            // clues are arranged numerically, with across clues coming first
            if (!found) {
                // across and down clue on the same square
                if (isAcrossClue && isDownClue) {
                    // across clues first
                    if (n == nclues) {
                        clue.isDown = false;
                        clue.length = nacross;
                        found = true;
                    } else if (n == nclues + 1) {
                        clue.isDown = true;
                        clue.length = ndown;
                        found = true;
                    }
                // only one of across/down clue on this square
                } else if ((isAcrossClue || isDownClue) && n == nclues) {
                    clue.isDown = isDownClue;
                    clue.length = isDownClue ? ndown : nacross;
                    found = true;
                }
                if (found) {
                    clue.number = number;
                    clue.row = row;
                    clue.col = col;
                    return clue;
                }
            }
            number++;
            nclues += isDownClue + isAcrossClue;
        }
    }
    return null;
}

function puzToEno(p) {
    const h = p.header;
    var eno = "# meta\n";
    eno += "name: " + h.name + "\n";
    eno += "author: " + h.author + "\n";
    if (h.copyright)
        eno += "copyright: " + h.copyright + "\n";
    eno += "# grid\n";
    eno += "width: " + h.width + "\n";
    eno += "height: " + h.height + "\n";
    eno += "# clues\n";
    for (var i = 0; i < h.numClues; i++) {
        const clue = getClue(p, i);
        if (!clue)
            break;
        eno += "## " + clue.number + (clue.isDown ? 'D' : 'A') + "\n"
        eno += "row: " + (clue.row + 1) + "\n";
        eno += "col: " + (clue.col + 1) + "\n";
        eno += "text: " + p.clues[i] + "\n";
        eno += "lengths:\n    - " + clue.length + "\n";
    }
    return eno;
}

export function readEno(buf) {
    return puzToEno(readPuz(buf));
}
