import * as KeyCode from 'keycode-js';
import * as parser from './parser.js';

export class GridDisplay {
    constructor(parent) {
        this.inputAcross = true;
        const self = this;
        const container = document.createElement('div');
        container.classList.add('crossword-grid-container');
        container.onclick = function (e) {
            self.onClick(e);
        };
        parent.appendChild(container);
        this.gridContainer = container;
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
            self.handleKeydown(e);
        }
        input.onkeypress = function(e) {
            self.handleKeypress(e);
        }
        input.onmousedown = function(e) {
            e.preventDefault();
        }
        input.onblur = function(e) {
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

    clearHighlight() {
        this.gridContainer.querySelectorAll('.highlighted').forEach(
            el => el.classList.remove('highlighted')
        );
    }

    hideInputCell() {
        const el = this.inputCell.el;
        const cell = this.currentCell();
        cell.td.textContent = cell.contents;
        el.value = '';
        el.style.display = 'none';
        this.clearHighlight();
    }

    highlightClue(clue) {
        this.clearHighlight();
        const cells = this.crossword.grid.cells;
        parser.forEachCell(clue, cells, function (cell) {
            cell.td.classList.add('highlighted');
        });
    }

    highlightCurrentClue() {
        this.highlightClue(this.currentClue());
    }

    setInputCell(row, col, backspace) {
        const cells = this.crossword.grid.cells;
        const input = this.inputCell;
        const el = input.el;
        let cell = this.currentCell();
        cell.td.textContent = cell.contents;

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
        td.textContent = '';

        el.value = cell.contents;
        el.style.display = '';
        el.style.left = td.offsetLeft + 'px';
        el.style.top = td.offsetTop + 'px';
        el.focus();
        el.select();

        this.highlightCurrentClue();
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
                cell.contents = '';
                cell.td.textContent = '';
                input.el.value = '';
            case KeyCode.KEY_LEFT:
            case KeyCode.KEY_UP:
                this.moveInputCell(-1);
                break;
            case KeyCode.KEY_ESCAPE:
                this.hideInputCell();
                break;
        }
    }

    storeInput(val) {
        const input = this.inputCell;
        const cell = this.currentCell();
        input.el.value = '';
        cell.contents = val;
        cell.td.textContent = val;
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
        this.gridTable = table;
        this.gridContainer.appendChild(table);
    }
}