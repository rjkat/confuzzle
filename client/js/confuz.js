const ShareablePuz = require('@confuzzle/puz-sharing').ShareablePuz;
const parser = require('./parser');
const puz_common = require('@confuzzle/puz-common');
const base64url = require("base64url");
const LZUTF8 = require('lzutf8');

export function compressURL(source) {
    return base64url.fromBase64(LZUTF8.compress(source, {outputEncoding: "Base64"}));
}

export function decompressURL(url, outputEncoding) {
    if (!outputEncoding) {
        outputEncoding = "String";
    }
    return LZUTF8.decompress(base64url.toBuffer(url), {outputEncoding: outputEncoding});
}

function fuzClues(clues, options) {
    var eno = "\n# clues\n";
    for (let [clueid, clue] of Object.entries(clues)) {
        const ans = options.scramble ? Buffer.from(clue.solution).toString('base64') : clue.solution;
        eno += "\n## " + clue.id + "\n"
        eno += "row: " + clue.row + "\n";
        eno += "col: " + clue.col + "\n";
        eno += "text: " + clue.text + "\n";
        if (clue.verbatim)
            eno += "verbatim\n"
        if (!options.strip)
            eno += "ans: " + ans + "\n";
        eno += 'lengths:\n    - ' + clue.lengths.join('\n    - ') + '\n';
        if (clue.separators && clue.separators.length > 0) {
            eno += 'separators:\n    - ' + clue.separators.join('\n    - ') + '\n';
        }
    }
    return eno;
}

function fuzMeta(meta, options) {
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

    if (!options.strip)
        eno += "scramble: " + (options.scramble ? "base64" : "none") + "\n";
    
    return eno;
}

function fuzGrid(grid) {
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

function fuzRefs(clues) {
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

export function stateFromClues(clues) {
    var state = '';
    var written = {};
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
            written[clueid] = true;
        }
    }
    return state;
}

export function fromPuz(p) {
    const clues = p.parseClues();
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
        eno += "\n## " + clue.number + (clue.isAcross ? 'A' : 'D') + "\n"
        eno += "row: " + (clue.row + 1) + "\n";
        eno += "col: " + (clue.col + 1) + "\n";

        var text = clue.text;
        var separators = null;
        var lengths = [clue.length];
        var verbatim = true;
        const toks = text.match(/^(.*) \((.*\b\d+\b.*)\)\s*$/);

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
            } else {
                text = toks[1];
                separators = toks[2].match(/[^\d\s]/g);
                verbatim = false;
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
            state += "\n## " + clue.number + (clue.isAcross ? 'A' : 'D') + "\n"
            state += 'ans: ' + ans + '\n';
        }
    }

    if (haveState) {
        eno += state;
    }
    return eno;
}

export function fromCrossword(crossword, options) {
    var eno = fuzMeta(crossword.meta, options);
    
    eno += fuzGrid(crossword.grid);
    eno += fuzClues(crossword.clues, options);

    var refs = fuzRefs(crossword.clues);
    if (refs)
        eno += refs;

    var state = stateFromClues(crossword.clues);
    if (state)
        eno += state;

    return eno;
}

function puzText(clue) {
    var text = clue.text;
    if (clue.verbatim)
        return text;

    return text + ' ' + clue.lengthText;
}

export function toPuz(eno) {
    const cw = parser.parse(eno);
    const meta = cw.meta;
    const grid = cw.grid;
    var solution = '';
    var state = '';
    var haveState = false;
    var clues = [];

    for (var row = 0; row < grid.height; row++) {
        for (var col = 0; col < grid.width; col++) {
            const cell = grid.cells[row][col];
            solution += cell.empty ? '.' : (cell.solution ? cell.solution : 'X');
            if (!cell.empty && cell.contents)
                haveState = true;
            state += cell.empty ? '.' : (cell.contents ? cell.contents.toUpperCase() : '-');
            
            if (!cell.clues)
                continue
            
            if (cell.clues.acrossId && cell.offsets.across == 0) {
                const acrossClue = cw.clues[cell.clues.acrossId];
                clues.push(puzText(acrossClue));
            }
            if (cell.clues.downId && cell.offsets.down == 0) {
                const downClue = cw.clues[cell.clues.downId];
                clues.push(puzText(downClue));
            }
        }
    }

    const puz = {
        title: meta.name,
        author: meta.author,
        copyright: meta.copyright,
        note: meta.note,
        width: grid.width,
        height: grid.height,
        clues: clues,
        solution: solution,
        state: puz_common.emptyState(solution),
        hasState: haveState
    }

    return new ShareablePuz(puz);
}
