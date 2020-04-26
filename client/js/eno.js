import {readPuz} from './puz.js';
const parser = require('./parser.js');

const BLACK_SQUARE_CHAR = '.';

function isBlackSquare(grid, row, ncols, col) {
    return grid[row*ncols + col] === BLACK_SQUARE_CHAR;
}

function acrossSoln(grid, row, ncols, col) {
    var pos = row * ncols + col;
    var soln = '';
    while (pos < (row + 1) * ncols) {
        if (grid[pos] == BLACK_SQUARE_CHAR)
            break;
        soln += grid[pos];
        pos++;
    }
    return soln;
}

function downSoln(grid, nrows, row, ncols, col) {
    var pos = row * ncols + col;
    var soln = '';
    while (pos < nrows * ncols) {
        if (grid[pos] == BLACK_SQUARE_CHAR)
            break;
        soln += grid[pos];
        pos += ncols;
    }
    return soln;
}

function getClues(p) {
    const nrows = p.header.height;
    const ncols = p.header.width;
    const grid = p.solution;
    var row, col;
    var number = 1;
    var clues = [];
    for (row = 0; row < nrows; row++) {
        for (col = 0; col < ncols; col++) {
            if (isBlackSquare(grid, row, ncols, col))
                continue;
            var numbered = false;
            var isAcrossSpace, isDownSpace;
            var isAcrossClue = false;
            var isDownClue = false;
            var aSoln, dSoln;
            isAcrossSpace = col == 0 || isBlackSquare(grid, row, ncols, col - 1);
            aSoln = acrossSoln(grid, row, ncols, col);
            if (isAcrossSpace && aSoln.length > 1) {
                numbered = true;
                isAcrossClue = true;
            }
            isDownSpace = row == 0 || isBlackSquare(grid, row - 1, ncols, col);
            dSoln = downSoln(grid, nrows, row, ncols, col);
            if (isDownSpace && dSoln.length > 1) {
                numbered = true;
                isDownClue = true;
            }
            if (!numbered)
                continue;

            // clues are arranged numerically, with across clues coming first
            if (isAcrossClue) {
                clues.push({
                    number: number,
                    solution: aSoln,
                    row: row,
                    col: col,
                    isDown: false,
                    length: aSoln.length
                });
            }
            if (isDownClue) {
                clues.push({
                    number: number,
                    solution: dSoln,
                    row: row,
                    col: col,
                    isDown: true,
                    length: dSoln.length
                });
            }
            number++;
        }
    }
    return clues;
}

export function puzToEno(p) {
    const h = p.header;
    const clues = getClues(p);

    var eno = "# meta\n";
    eno += "name: " + p.title + "\n";
    eno += "author: " + p.author + "\n";
    if (p.copyright)
        eno += "copyright: " + p.copyright + "\n";
    // in the case where there are more clues than squares, the "note"
    // field comes after the clues
    if (p.note) {
        eno += "--note\n"
        eno += p.note + "\n";
        eno += "--note\n"
    }
    eno += "\n# grid\n";
    eno += "width: " + h.width + "\n";
    eno += "height: " + h.height + "\n";
    
    eno += "\n# clues\n";
    for (var i = 0; i < clues.length; i++) {
        const clue = clues[i];
        eno += "\n## " + clue.number + (clue.isDown ? 'D' : 'A') + "\n"
        eno += "row: " + (clue.row + 1) + "\n";
        eno += "col: " + (clue.col + 1) + "\n";
        eno += "text: " + p.clues[i] + "\n";

        // eno += "soln: " + clue.solution + "\n";
        eno += "lengths:\n    - " + clue.length + "\n";
    }
    return eno;
}

export function readEno(buf) {
    return puzToEno(readPuz(buf));
}

export function enoToPuz(eno) {
    const cw = parser.parse(eno);
    const meta = cw.meta;
    const grid = cw.grid;
    var solution = '';
    var clues = [];
    for (var row = 0; row < grid.height; row++) {
        for (var col = 0; col < grid.width; col++) {
            const cell = grid.cells[row][col];
            solution += cell.empty ? '.' : (cell.solution ? cell.solution : 'X');
            if (!cell.number)
                continue
            
            if (cell.clues.across && cell.offsets.across == 0) {
                clues.push(cell.clues.across.text);
            }
            if (cell.clues.down && cell.offsets.down == 0) {
                clues.push(cell.clues.down.text);
            }
        }
    }
    return {
        title: meta.name,
        author: meta.author,
        copyright: meta.copyright,
        note: meta.note,
        width: grid.width,
        height: grid.height,
        solution: solution,
        clues: clues
    }
}
