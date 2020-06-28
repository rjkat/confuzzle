export class GridDisplay {
    constructor(cwDisplay, parent) {
        this.cwDisplay = cwDisplay;
        this.inputAcross = true;
        const self = this;
        const container = document.createElement('div');
        container.classList.add('crossword-grid-container');
       
        parent.prepend(container);
        this.gridContainer = container;
        this.id = uniqid();
    }

    setCrossword(crossword) {
        this.crossword = crossword;
        this.gridContainer.innerHTML = "";
        this.drawGrid(crossword);
        this.createInput();
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

        input.onclick = function(e) {
            // switch directions
            const target = e.target;
            const cell = self.currentCell();
            if (cell.clues.across && cell.clues.down) {
                self.inputAcross = !self.inputAcross;
                this.focus();
                this.select();
                self.selectCurrentClue();
                e.preventDefault();
            }
        };
    }

    currentCell() {
        const cells = this.crossword.grid.cells;
        const input = this.inputCell;
        return cells[input.row][input.col];
    }

    currentClue() {
        const cell = this.currentCell();
        if (!cell || !cell.clues) {
            return undefined;
        }
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

    highlightClue(clueid, solverid, nested) {
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
        const refids = clue.refIds
        if (refids) {
            for (var i = 0; i < refids.length; i++) {
                if (refids[i] != clueid && !nested) {
                    this.highlightClue(refids[i], solverid, true);
                }
            }
        }
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

    clearHighlightClue(clueid, solverid, nested) {
        if (solverid === undefined) {
            return;
        }
        const clue = this.crossword.clues[clueid];
        clue.cells.forEach(cell => clearSolverMask(cell.td, solverid, clue.isAcross, !clue.isAcross));
        const refids = clue.refIds
        if (refids) {
            for (var i = 0; i < refids.length; i++) {
                if (refids[i] != clueid && !nested) {
                    this.clearHighlightClue(refids[i], solverid, true);
                }
            }
        }
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
        el.style.top = td.offsetTop + 'px';
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
        const self = this;
        table.onclick = function (e) {
            self.onClick(e);
        };
        for (let row = 0; row < cells.length; row++) {
            const tr = document.createElement('tr');
            for (let col = 0; col < cells[row].length; col++) {
                const td = document.createElement('td');
                const cell = cells[row][col];

                const text = document.createElement('span');
                const hlBorder = document.createElement('div');
                hlBorder.style.borderColor = 'transparent';
                hlBorder.classList.add('cell-highlight-border');
                td.appendChild(text);
                td.appendChild(hlBorder);

                td.dataset.row = row;
                td.dataset.col = col;
                td.dataset.solverMask = 0;
                td.firstChild.textContent = cell.contents;
                if (cell.empty) {
                    td.dataset.empty = '';
                }
                if (cell.number) {
                    td.dataset.number = cell.number;
                }
                if (cell.acrossSeparator) {
                    td.dataset.acrossSeparator = cell.acrossSeparator;
                }
                if (cell.downSeparator) {
                    td.dataset.downSeparator = cell.downSeparator;
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
                    if (hlBorder.style.borderColor != 'transparent') {
                        hlBorder.style.borderWidth = '0.15ch';
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

        // const copyright = document.getElementById('copyright-text');
        // copyright.textContent = 'Copyright';
        // if (crossword.meta.copyright) {
        //     copyright.textContent = crossword.meta.copyright;
        // }
    }
}
