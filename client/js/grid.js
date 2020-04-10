import * as KeyCode from 'keycode-js';
const uniqid = require('uniqid');

// https://graphics.stanford.edu/~seander/bithacks.html
function nBitsSet(v) {
    let n = 0;
    while (v) {
        n++;
        v &= v - 1; // clear the least significant bit set
    }
    return n;
}

function clearSolverMask(td, solverid, clearAcross, clearDown) {
    if (!td) {
        return;
    }
    if (clearAcross) {
        td.dataset.acrossMask &= ~(1 << solverid);
    }
    if (clearDown) {
        td.dataset.downMask &= ~(1 << solverid);
    }
    td.dataset.solverMask = (td.dataset.acrossMask | td.dataset.downMask);
}

export class GridDisplay {
    constructor(cwDisplay, parent) {
        this.cwDisplay = cwDisplay;
        this.inputAcross = true;
        const self = this;
        const container = document.createElement('div');
        container.classList.add('crossword-grid-container');
        container.onclick = function (e) {
            self.onClick(e);
        };
        parent.appendChild(container);
        this.gridContainer = container;
        this.id = uniqid();
    }

    setCrossword(crossword) {
        this.crossword = crossword;
        this.gridContainer.innerHTML = "";
        this.drawGrid(crossword);
        this.createInput();
    }

    onClick(e) {
        e.preventDefault();
        const target = e.target;
        const input = this.inputCell;
        // switch directions
        if (target.nodeName == 'INPUT' && target.classList.contains('crossword-grid-input')) {
            const cell = this.currentCell();
            if (cell.clues.across && cell.clues.down) {
                this.inputAcross = !this.inputAcross;
            }
            input.el.focus();
            input.el.select();
            this.selectCurrentClue();
            return;
        }

        let td = target;
        if (target.classList.contains('cell-highlight-border')) {
            td = target.parentNode;
        }
        // select cell
        if (td.nodeName != 'TD') {
            return;
        }
        if (td.dataset.empty !== undefined) {
            return;
        }
        const row = parseInt(td.dataset.row, 10);
        const col = parseInt(td.dataset.col, 10);

        const offsets = td.dataset.offset.split(',');
        // if it's both a down and across clue, and they've
        // clicked on a first letter, change direction to match
        // the clue with the first letter
        if (offsets.length > 1) {
            for (let i = 0; i < offsets.length; i++) {
                if (parseInt(offsets[i], 10) == 0) {
                    this.inputAcross = (i == 0);
                    break;
                }
            }
        }
        this.setInputCell(row, col);
    }

    createInput() {
        let input = document.createElement('input');
        input.classList.add('crossword-grid-input');
        input.style.display = 'none';
        input.type = 'text';
        const self = this;
        input.onkeydown = e => self.handleKeydown(e);
        input.onkeypress = e => self.handleKeypress(e);
        input.onmousedown = e => e.preventDefault();
        input.onblur = e => {
            e.preventDefault();
            self.hideInputCell();
        }
        input.setAttribute('maxlength', 1);
        this.gridContainer.appendChild(input);
        this.inputCell = {
            el: input,
            row: 0,
            col: 0,
        };
    }

    currentCell() {
        const cells = this.crossword.grid.cells;
        const input = this.inputCell;
        return cells[input.row][input.col];
    }

    currentClue() {
        const cell = this.currentCell();
        return this.inputAcross ? cell.clues.across : cell.clues.down;
    }

    selectCurrentClue() {
        const scroll = true;
        this.cwDisplay.selectClue(this.currentClue().id, scroll);
    }

    moveInputCell(direction) {
        const input = this.inputCell;
        let row, col;
        if (this.inputAcross) {
            row = input.row;
            col = input.col + direction;
        } else {
            row = input.row + direction;
            col = input.col;
        }
        let backspace = direction == -1;
        this.setInputCell(row, col, backspace);
    }

    hideInputCell() {
        const el = this.inputCell.el;
        const cell = this.currentCell();
        cell.td.firstChild.textContent = cell.contents;
        el.value = '';
        el.style.display = 'none';
        this.cwDisplay.clearOwnHighlight(this.currentClue().id);
    }

    highlightClue(clueid, solverid) {
        if (solverid === undefined) {
            return;
        }
        const clue = this.crossword.clues[clueid];
        clue.cells.forEach(cell => {
            if (clue.isAcross) {
                cell.td.dataset.acrossMask |= (1 << solverid);
            } else {
                cell.td.dataset.downMask |= (1 << solverid);
            }
            let v = (cell.td.dataset.acrossMask | cell.td.dataset.downMask);
            // can only show 4 overlapping solvers...
            while (nBitsSet(v) > 4) {
                v &= v - 1; // clear the least significant bit set
            }
            cell.td.dataset.solverMask = v;
        });
    }

    clearAllClues(solverid) {
        if (solverid === undefined) {
            return;
        }
        const cells = this.crossword.grid.cells;
        cells.forEach(row => {
            row.forEach(cell => {
                clearSolverMask(cell.td, solverid, true, true);
            });
        });
    }

    clearHighlightClue(clueid, solverid) {
        if (solverid === undefined) {
            return;
        }
        const clue = this.crossword.clues[clueid];
        clue.cells.forEach(cell => clearSolverMask(cell.td, solverid, clue.isAcross, !clue.isAcross));
    }

    setInputCell(row, col, backspace) {
        const cells = this.crossword.grid.cells;
        const input = this.inputCell;
        const el = input.el;
        let cell = this.currentCell();
        cell.td.firstChild.textContent = cell.contents;

        // we've run off the end or hit an empty square
        if (   row < 0 || row >= cells.length
            || col < 0 || col >= cells[row].length
            || cells[row][col].empty) {
            // make it so that backspace doesn't hide the input
            if (!backspace) {
                this.hideInputCell();
            }
            return;
        }
        input.row = row;
        input.col = col;
        cell = this.currentCell();
        // if the clue can only be either across or down,
        // change to its direction
        if (!(cell.clues.across && cell.clues.down)) {
            this.inputAcross = Boolean(cell.clues.across);
        }

        const td = cell.td;
        td.firstChild.textContent = '';

        el.value = cell.contents;
        el.style.display = '';
        el.style.left = td.offsetLeft + 'px';
        el.style.top = td.offsetTop + td.firstChild.clientTop + 'px';
        el.focus();
        el.select();

        this.selectCurrentClue();
    }

    handleKeydown(e) {
        const input = this.inputCell;
        const cell = this.currentCell();
        switch (e.keyCode) {
            case KeyCode.KEY_SPACE:
            case KeyCode.KEY_RIGHT:
            case KeyCode.KEY_DOWN:
                this.moveInputCell(1);
                break;
            case KeyCode.KEY_BACK_SPACE:
                e.preventDefault();
                input.el.value = '';
                this.fillCurrentCell('');
            case KeyCode.KEY_LEFT:
            case KeyCode.KEY_UP:
                this.moveInputCell(-1);
                break;
            case KeyCode.KEY_ESCAPE:
            case KeyCode.KEY_RETURN:
                this.hideInputCell();
                break;
        }
    }

    fillCurrentCell(val) {
        const cell = this.currentCell();
        const clue = this.currentClue();
        const offset = clue.isAcross ? cell.offsets.across : cell.offsets.down;
        this.cwDisplay.fillCell(clue.id, offset, val);
        cell.contents = val;
    }

    storeInput(val) {
        this.inputCell.el.value = '';
        this.fillCurrentCell(val);
    }

    handleKeypress(e) {
        e.preventDefault();
        this.storeInput(e.key);
        this.moveInputCell(1);
    }

    drawGrid(crossword) {
        const cells = crossword.grid.cells;
        const table = document.createElement('table');
        table.classList.add('crossword-grid');
        table.setAttribute('cellSpacing', 0);
        for (let row = 0; row < cells.length; row++) {
            const tr = document.createElement('tr');
            for (let col = 0; col < cells[row].length; col++) {
                const td = document.createElement('td');
                const cell = cells[row][col];

                const hlBorder = document.createElement('div');
                hlBorder.style.borderColor = 'transparent';
                hlBorder.classList.add('cell-highlight-border');
                td.appendChild(hlBorder);

                td.dataset.row = row;
                td.dataset.col = col;
                td.dataset.solverMask = 0;
                if (cell.empty) {
                    td.dataset.empty = '';
                }
                if (cell.number) {
                    td.dataset.number = cell.number;
                }
                if (cell.clues) {
                    const across = cell.clues.across;
                    const down = cell.clues.down;
                    td.dataset.clueid = '';
                    td.dataset.offset = '';
                    if (across) {
                        td.dataset.clueid = across.id;
                        td.dataset.offset = cell.offsets.across;
                        const c = across.shadingColor || cell.shadingColor;
                        if (c) {
                            td.style.backgroundColor = c;
                            hlBorder.style.borderColor = c;
                        }
                        if (down) {
                            td.dataset.clueid += ',';
                            td.dataset.offset += ',';
                        }
                    }
                    if (down) {
                        td.dataset.clueid += down.id;
                        td.dataset.offset += cell.offsets.down;
                        const c = down.shadingColor || cell.shadingColor;
                        if (c) {
                            td.style.backgroundColor = c;
                            hlBorder.style.borderColor = c;
                        }
                    }
                }
                cell.td = td;
                cells[row][col] = cell;

                const shading = crossword.grid.shading;
                if (shading) {
                    shading.forEach(rule => {
                        if (rule.startRow
                           && row >= (rule.startRow - 1) && row <= (rule.endRow - 1)
                           && col >= (rule.startCol - 1) && col <= (rule.endCol - 1)) {
                            td.style.backgroundColor = rule.color;
                        }
                    });
                }

                tr.appendChild(td);
            }
            table.appendChild(tr);
        }

        this.gridTable = table;
        this.gridContainer.appendChild(table);
    }
}
