import * as KeyCode from 'keycode-js';

import * as parser from './parser.js';

export class CrosswordDisplay {
    constructor(parent) {
        this.parent = parent;
        this.inputAcross = true;
        const self = this;
        parent.onclick = function (e) {
            self.onClick(e);
        };
    }

    setCrossword(crossword) {
        this.crossword = crossword;
        this.parent.innerHTML = "";
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
                this.highlightCurrentClue();
            }
            input.el.focus();
            input.el.select();
            return;
        }

        // select cell
        if (target.nodeName != 'TD') {
            return;
        }
        const row = parseInt(target.dataset.row, 10);
        const col = parseInt(target.dataset.col, 10);
        this.setInputCell(row, col);
    }

    createInput() {
        let input = document.createElement('input');
        input.classList.add('crossword-grid-input');
        input.style.display = 'none';
        input.type = 'text';
        const self = this;
        input.onkeydown = function(e) {
            self.handleKeydown(e, true);
        }
        input.onkeypress = function(e) {
            self.handleKeypress(e, true);
        }
        input.onmousedown = function(e){
            e.preventDefault();
        }
        input.setAttribute('maxlength', 1);
        this.gridWrapper.appendChild(input);
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
        this.setInputCell(row, col, direction);
    }

    clearHighlight() {
        this.gridWrapper.querySelectorAll('.highlighted').forEach(
            el => el.classList.remove('highlighted')
        );
    }

    highlightCurrentClue() {
        this.clearHighlight();
        const cells = this.crossword.grid.cells;
        const clue = this.currentClue();
        parser.forEachCell(clue, cells, function (cell) {
            cell.td.classList.add('highlighted');
        });
    }

    setInputCell(row, col, moveDirection) {
        const cells = this.crossword.grid.cells;
        const input = this.inputCell;
        const el = input.el;
        let cell = cells[input.row][input.col];
        cell.td.textContent = cell.contents;

        if (   row < 0 || row >= cells.length
            || col < 0 || col >= cells[row].length
            || cells[row][col].empty) {
            // make it so that backspace doesn't hide the input
            if (moveDirection != -1) {
                el.value = '';
                el.style.display = 'none';
                this.clearHighlight();
            }
            return;
        }
        input.row = row;
        input.col = col;
        cell = this.currentCell();
        if (!(cell.clues.across && cell.clues.down)) {
            this.inputAcross = Boolean(cell.clues.across);
        }
        
        const td = cell.td;
        td.textContent = '';

        el.value = cell.contents;
        el.style.display = '';
        el.style.left = td.offsetLeft + 'px';
        el.style.top = td.offsetTop + 'px';
        el.focus();
        el.select();

        this.highlightCurrentClue();
    }

    handleKeydown(e, isGrid) {
        const input = this.inputCell;
        const cells = this.crossword.grid.cells;
        const cell = cells[input.row][input.col];
        switch (e.keyCode) {
            case KeyCode.KEY_SPACE:
            case KeyCode.KEY_RIGHT:
            case KeyCode.KEY_DOWN:
                this.moveInputCell(1);
                break;
            case KeyCode.KEY_BACK_SPACE:
                e.preventDefault();
                if (isGrid) {
                    cell.contents = '';
                    cell.td.textContent = '';
                    input.el.value = '';
                }
            case KeyCode.KEY_LEFT:
            case KeyCode.KEY_UP:
                this.moveInputCell(-1);
                break;
        }
    }

    storeInput(val, isGrid) {
        if (isGrid) {
            const input = this.inputCell;
            const cell = this.crossword.grid.cells[input.row][input.col];
            input.el.value = '';
            cell.contents = val;
            cell.td.textContent = val;
        }
    }

    handleKeypress(e, isGrid) {
        e.preventDefault();
        this.storeInput(e.key, isGrid);
        this.moveInputCell(1);
    }

    drawGrid(crossword) {
        const cells = crossword.grid.cells;
        let wrapper = document.createElement('div');
        wrapper.classList.add('crossword-grid-wrapper');
        let table = document.createElement('table');
        table.classList.add('crossword-grid');
        table.setAttribute('cellSpacing', 0);
        for (let row = 0; row < cells.length; row++) {
            const tr = document.createElement('tr');
            for (let col = 0; col < cells[row].length; col++) {
                const td = document.createElement('td');
                const cell = cells[row][col];
                td.dataset.row = row;
                td.dataset.col = col;
                if (cell.empty) {
                    td.dataset.empty = '';
                }
                if (cell.number) {
                    td.dataset.number = cell.number;
                }
                cell.td = td;
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        wrapper.appendChild(table);
        this.parent.appendChild(wrapper);
        this.gridWrapper = wrapper;
    }
}