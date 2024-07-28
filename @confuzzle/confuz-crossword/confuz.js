const ShareablePuz = require('@confuzzle/puz-sharing').ShareablePuz;
const parser = require('@confuzzle/confuz-parser');
const puz_common = require('@confuzzle/puz-common');
const base64url = require("base64url");
const mtf = require('@confuzzle/move-to-front');
const bwt = require('@confuzzle/burrows-wheeler');
const rc = require('@thi.ng/range-coder');

function compressURL(source) {
    const t = bwt.forward(source);
    const m = mtf.forward(t);
    const x = rc.encodeBytes(m);
    return base64url.encode(x);
}

function decompressURL(url, outputEncoding) {
    const x = base64url.toBuffer(url);
    const m = rc.decodeBytes(x);
    const t = mtf.inverse(m);
    const s = bwt.inverse(t);
    return s.toString();
}

function fuzClues(clues, options) {
    var eno = "\n# clues\n";
    for (let [clueid, clue] of Object.entries(clues)) {
        const ans = options.scramble ? Buffer.from(clue.solution).toString('base64') : clue.solution;
        eno += "\n## " + clue.id + "\n"
        eno += "row: " + clue.row + "\n";
        eno += "col: " + clue.col + "\n";
        if (clue.text)
            eno += "text: " + clue.text + "\n";
        if (clue.verbatim)
            eno += "verbatim\n"
        if (clue.hidden)
            eno += "hidden\n"
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
                eno += 'rows:\n    - ' + rule.rows.join('\n    - ') + '\n';
                eno += 'cols:\n    - ' + rule.cols.join('\n    - ') + '\n';
            }
        }
    }
    if (grid.annotations) {
        eno += '\n## annotations\n';
        for (var i = 0; i < grid.annotations.length; i++) {
            const rule = grid.annotations[i];
            eno += '\n### ' + rule.name + '\n';
            if (rule.mark) {
                eno += 'mark: ' + rule.mark + '\n';
            } else {
                eno += 'rebus: ' + rule.rebus + '\n';
            }
            eno += 'rows:\n    - ' + rule.rows.join('\n    - ') + '\n';
            eno += 'cols:\n    - ' + rule.cols.join('\n    - ') + '\n';
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

function stateFromClues(grid, clues) {
    var state = '';
    var written = {};
    for (let [clueid, clue] of Object.entries(clues)) {
        var ans = '';
        var special = '';
        var nfilled = 0;
        var haveSpecial = false;
        for (var i = 0; i < clue.cellIds.length; i++) {
            const cell = grid.cells[clue.cellIds[i]];
            const c = cell.contents;
            const s = cell.special;
            if (s && s != '-') {
                haveSpecial = true;
            }
            if (c || haveSpecial) {
                nfilled++;
                ans += c ? c.toUpperCase() : '-';
                if (haveSpecial) {
                    special += s;
                } else {
                    special += '-';
                }
            } else {
                ans += '-';
                special += '-';
            }
        }

        /* if all cells are already in another clue with more filled-in
         * cells, don't write this one */
        
        var nneeded = nfilled;
        if (!haveSpecial) {
            for (var i = 0; i < clue.cellIds.length; i++) {
                const cell = grid.cells[clue.cellIds[i]];
                const otherClue = clue.isAcross ? cell.clues.down : cell.clues.across;
                if (!otherClue)
                    continue;
                var nother = 0;
                for (var j = 0; j < otherClue.cellIds.length; j++) {
                    const otherCell = grid.cells[otherClue.cellIds[j]];
                    if (otherCell.contents) {
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
        }

        if (nneeded > 0 || haveSpecial || clue.mark) {
            if (!state) {
                state = '\n# state\n';
            }
            state += '\n## ' + clueid + '\n';
            if (clue.mark) {
                state += 'mark: ' + clue.mark + '\n';
            }
            state += 'ans: ' + ans + '\n';
            if (haveSpecial) {
                state += 'special: ' + special + '\n';
            }
            written[clueid] = true;
        }
    }
    return state;
}

function fromPuz(p) {
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

    if (p.sections) {
        for (var i = 0; i < p.sections.length; i++) {
            if (p.sections[i].title == 'GEXT') {
                let annotation_rows = [];
                let annotation_cols = [];
                for (var row = 0; row < p.height; row++) {
                    for (var col = 0; col < p.width; col++) {
                        const g = p.sections[i].data[row * p.width + col];
                        if (g & 0x80) {
                            annotation_rows.push(row + 1);
                            annotation_cols.push(col + 1);
                        }
                    }
                }

                if (annotation_rows.length > 0) {
                    eno += '\n## annotations\n';
                    eno += '\n### circled\n';
                    eno += 'mark: circle\n';
                    eno += 'rows:\n    - ' + annotation_rows.join('\n    - ') + '\n';
                    eno += 'cols:\n    - ' + annotation_cols.join('\n    - ') + '\n';
                }
            }
        }
    }
    
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

        const toks = text ? text.match(/^(.*) \((.*\b\d+\b.*)\)\s*$/) : null;

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

function fromCrossword(crossword, options) {
    var eno = fuzMeta(crossword.meta, options);
    
    eno += fuzGrid(crossword.grid);
    eno += fuzClues(crossword.clues, options);

    var refs = fuzRefs(crossword.clues);
    if (refs)
        eno += refs;

    if (!options.scramble) {
        var state = stateFromClues(crossword.grid, crossword.clues);
        if (state)
            eno += state;
    }
    return eno;
}

function puzText(clue) {
    var text = clue.text;
    if (clue.verbatim)
        return text;

    return text + ' ' + clue.lengthText;
}

function toPuz(eno) {
    const cw = parser.parse(eno);
    const meta = cw.meta;
    const grid = cw.grid;
    var solution = '';
    var state = '';
    var haveState = false;
    var clues = [];
    var gext = [];

    for (var row = 0; row < grid.height; row++) {
        gext[row] = [];
        for (var col = 0; col < grid.width; col++) {
            const cell = grid.cells[`${row},${col}`];
            solution += cell.empty ? '.' : (cell.solution ? cell.solution : 'X');
            if (!cell.empty && cell.contents)
                haveState = true;
            state += cell.empty ? '.' : (cell.contents ? cell.contents.toUpperCase() : '-');
            
            gext[row].push(cell.mark ? 0x00 : 0x80);

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
        state: haveState ? state : puz_common.emptyState(solution),
        hasState: haveState
    }

    return new ShareablePuz(puz);
}


module.exports = {
    compressURL: compressURL,
    decompressURL: decompressURL,
    stateFromClues: stateFromClues,
    fromCrossword: fromCrossword,
    fromPuz: fromPuz,
    toPuz: toPuz,
}
