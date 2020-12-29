import {PuzPayload} from './puz.js';
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
    const nrows = p.height;
    const ncols = p.width;
    const grid = p.solution;
    const state = p.state;
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
                    state: acrossSoln(state, row, ncols, col),
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
                    state: downSoln(state, row, ncols, col),
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

function enoClues(clues, scramble) {
    var eno = "\n# clues\n";
    for (let [clueid, clue] of Object.entries(clues)) {
        const ans = scramble ? Buffer.from(clue.solution).toString('base64') : clue.solution;
        eno += "\n## " + clue.id + "\n"
        eno += "row: " + clue.row + "\n";
        eno += "col: " + clue.col + "\n";
        eno += "text: " + clue.text + "\n";
        if (clue.verbatim)
            eno += "verbatim\n"
        eno += "ans: " + ans + "\n";
        eno += 'lengths:\n    - ' + clue.lengths.join('\n    - ') + '\n';
        if (clue.separators && clue.separators.length > 0) {
            eno += 'separators:\n    - ' + clue.separators.join('\n    - ') + '\n';
        }
    }
    return eno;
}

function enoMeta(meta, scramble) {
    var eno = "# meta\n";
    eno += "name: " + meta.name + "\n";
    eno += "author: " + meta.author + "\n";

    if (meta.type)
        eno += "type: " + meta.type + "\n";
    if (meta.identifier)
        eno += "identifier: " + meta.identifier + "\n";   
    if (meta.copyright)
        eno += "copyright: " + meta.copyright + "\n";   

    if (meta.note) {
        eno += "--note\n"
        eno += meta.note + "\n";
        eno += "--note\n"
    }
    eno += "scramble: " + (scramble ? "base64" : "none") + "\n";
    
    return eno;
}

function enoGrid(grid) {
    var eno = "\n# grid\n";
    eno += "width: " + grid.width + "\n";
    eno += "height: " + grid.height + "\n";

    if (grid.shading) {
        eno += '\n## shading\n'
        for (var i = 0; i < grid.shading.length; i++) {
            const rule = grid.shading[i];
            eno += '\n### ' + rule.name + '\n';
            eno += 'color: ' + rule.color + '\n';
            if (rule.clues) {
                eno += 'clues:\n    - ' + rule.clues.join('\n    - ') + '\n';
            } else {
                eno += 'row: ' + rule.row + '\n';
                eno += 'col: ' + rule.col + '\n';
            }
        }
    }
    return eno;
}

function enoRefs(clues) {
    var refs = '';
    for (let [clueid, clue] of Object.entries(clues)) {
        if (clue.refIds.length == 0) {
            continue;
        }
        refs += '## ' + clue.id + '\n';
        refs += 'clues:\n    - ' + clue.refIds.join('\n    - ') + '\n';
        refs += 'separators:\n';
        if (clue.refSeparators && clue.refSeparators.length > 0) {
            refs += '    - ' + clue.refSeparators.join('\n    - ') + '\n';
        }
        refs += '\n';
    }
    
    if (refs)
        refs = '\n# references\n\n' + refs;
    return refs;
}

export function enoState(clues) {
    var state = '';
    for (let [clueid, clue] of Object.entries(clues)) {
        var ans = '';
        var nfilled = 0;
        for (var i = 0; i < clue.cells.length; i++) {
            const cell = clue.cells[i];
            const c = clue.cells[i].contents;
            if (c) {
                nfilled++;
                ans += c.toUpperCase();
            } else {
                ans += '-';
            }
        }

        /* if all cells are already in another clue with more filled-in
         * cells, don't write this one */
        var nneeded = nfilled;
        for (var i = 0; i < clue.cells.length; i++) {
            const cell = clue.cells[i];
            const otherClue = clue.isAcross ? cell.clues.down : cell.clues.across;
            if (!otherClue)
                continue;
            var nother = 0;
            for (var j = 0; j < otherClue.cells.length; j++) {
                if (otherClue.cells[j].contents) {
                    nother++;
                }
            }
            if (nother > nfilled ) {
                nneeded--;
            } else if (!clue.isAcross && nother == nfilled) {
                // tiebreak, prefer across clues to down
                nneeded--;
            }
        }

        if (nneeded > 0) {
            if (!state) {
                state = '\n# state\n';
            }
            state += '\n## ' + clueid + '\n';
            state += 'ans: ' + ans + '\n';
        }
    }
    return state;
}

export function puzToEno(p) {
    const clues = getClues(p);

    var eno = "# meta\n";
    var name = p.title;
    var author = p.author;
    // eno requires name and author
    if (!/\S/.test(name))
        name = '?'
    if (!/\S/.test(author))
        author = '?'
    eno += "name: " + name + "\n";
    eno += "author: " + author + "\n";
    eno += "scramble: base64\n";
    if (p.copyright)
        eno += "copyright: " + p.copyright + "\n";
    if (p.note) {
        eno += "--note\n"
        eno += p.note + "\n";
        eno += "--note\n"
    }
    eno += "\n# grid\n";
    eno += "width: " + p.width + "\n";
    eno += "height: " + p.height + "\n";
    
    eno += "\n# clues\n";
    for (var i = 0; i < clues.length; i++) {
        const clue = clues[i];
        eno += "\n## " + clue.number + (clue.isDown ? 'D' : 'A') + "\n"
        eno += "row: " + (clue.row + 1) + "\n";
        eno += "col: " + (clue.col + 1) + "\n";
        

        var text = p.clues[i];
        var separators = null;
        var lengths = [clue.length];
        const toks = text.match(/^(.*) \((.*)\)\s*$/);
        var verbatim = false;
        
        if (toks) {
            // looks like a multiple-word clue, see if the lengths add up
            lengths = toks[2].match(/\b\d+\b/g).map(x => parseInt(x));
            var totLen = 0;
            for (var j = 0; j < lengths.length; j++) {
                totLen += lengths[j];
            }

            // if they don't, ignore and treat clue as verbatim
            if (totLen != clue.length) {
                lengths = [clue.length];
                verbatim = true;
            } else {
                text = toks[1];
                separators = toks[2].match(/[^\d\s]/g);
            }
        }

        eno += "text: " + text + "\n";
        if (verbatim)
            eno += "verbatim\n"
        eno += "ans: " + Buffer.from(clue.solution).toString('base64') + "\n";
        eno += 'lengths:\n    - ' + lengths.join('\n    - ') + '\n';
        if (separators) {
            eno += 'separators:\n    - ' + separators.join('\n    - ') + '\n';
        }
    }

    var haveState = false;
    var state = '';

    for (var i = 0; i < clues.length; i++) {
        const clue = clues[i];
        var ans = '';
        var haveAns = false;
        for (var j = 0; j < clue.state.length; j++) {
            const c = clue.state[j];
            if (c != '-' && c != '.') {
                if (!haveState) {
                    haveState = true;
                    state = '\n# state\n';
                }
                ans += c.toUpperCase();
                haveAns = true;
            } else {
                ans += '-';
            }
        }
        if (haveAns) {
            state += "\n## " + clue.number + (clue.isDown ? 'D' : 'A') + "\n"
            state += 'ans: ' + ans + '\n';
        }
    }

    if (haveState) {
        eno += state;
    }
    return eno;
}

export function exportEno(crossword, scramble) {
    var eno = enoMeta(crossword.meta, scramble);
    
    eno += enoGrid(crossword.grid);
    eno += enoClues(crossword.clues, scramble);

    var refs = enoRefs(crossword.clues);
    if (refs)
        eno += refs;

    var state = enoState(crossword.clues);
    if (state)
        eno += state;

    return eno;
}

export function readEno(buf) {
    return puzToEno(PuzPayload.from(buf));
}

function puzText(clue) {
    var text = clue.text;
    if (!clue.verbatim) {
        text += ' ('
        for (var i = 0; i < clue.lengths.length; i++) {
            if (i > 0) {
                if (clue.separators) {
                    text += clue.separators[i - 1]
                } else {
                    text += ','
                }
            }
            text += clue.lengths[i];
        }
        text += ')'
    }
    return text;
}

export function enoToPuz(eno) {
    const cw = parser.parse(eno);
    const meta = cw.meta;
    const grid = cw.grid;
    var solution = '';
    var state = '';
    var clues = [];
    for (var row = 0; row < grid.height; row++) {
        for (var col = 0; col < grid.width; col++) {
            const cell = grid.cells[row][col];
            solution += cell.empty ? '.' : (cell.solution ? cell.solution : 'X');
            state += cell.empty ? '.' : (cell.contents ? cell.contents.toUpperCase() : '-');
            if (!cell.number)
                continue
            
            if (cell.clues.across && cell.offsets.across == 0) {
                clues.push(puzText(cell.clues.across));
            }
            if (cell.clues.down && cell.offsets.down == 0) {
                clues.push(puzText(cell.clues.down));
            }
        }
    }

    return new PuzPayload({
            title: meta.name,
            author: meta.author,
            copyright: meta.copyright,
            note: meta.note,
            width: grid.width,
            height: grid.height,
        },
        clues,
        solution,
        state
    );
}
