import * as KeyCode from 'keycode-js';

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
        const target = e.target;
        if (target.nodeName != 'TD') {
            return;
        }
        const row = parseInt(target.getAttribute('data-row'), 10);
        const col = parseInt(target.getAttribute('data-col'), 10);
        this.moveInput(row, col);
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
        input.setAttribute('maxlength', 1);
        this.gridWrapper.appendChild(input);
        this.gridInput = {
            el: input,
            row: 0,
            col: 0,
        };
    }

    moveInput(row, col) {
        let cells = this.crossword.grid.cells;
        let input = this.gridInput;

        let cell = cells[input.row][input.col];
        cell.td.textContent = cell.contents;

        if (   row < 0 || row >= cells.length
            || col < 0 || col >= cells[row].length
            || cells[row][col].empty) {
            input.el.blur();
            return;
        }
        cell = cells[row][col];
        let td = cell.td;
        td.textContent = '';

        let el = input.el;
        el.value = cell.contents;
        el.style.display = '';
        el.style.left = td.offsetLeft + 'px';
        el.style.top = td.offsetTop + 'px';
        el.focus();
        el.select();
        input.row = row;
        input.col = col;
    }

    advanceInput(rev) {
        let input = this.gridInput;
        if (this.inputAcross) {
            this.moveInput(input.row, input.col + (rev ? -1 : 1));
        } else {
            this.moveInput(input.row + (rev ? -1 : 1), input.col);
        }
    }

    handleKeydown(e, isGrid) {

        let input = this.gridInput;
        let cells = this.crossword.grid.cells;
        switch (e.keyCode) {
            case KeyCode.KEY_SPACE:
            case KeyCode.KEY_RIGHT:
            case KeyCode.KEY_DOWN:
                this.advanceInput();
                break;
            case KeyCode.KEY_BACK_SPACE:
                e.preventDefault();
                if (isGrid) {
                    cells[input.row][input.col].contents = '';
                    cells[input.row][input.col].td.textContent = '';
                    input.el.value = '';
                }
            case KeyCode.KEY_LEFT:
            case KeyCode.KEY_UP:
                this.advanceInput(true);
                break;
        }
    }

    storeInput(val, isGrid) {
        if (isGrid) {
            let input = this.gridInput;
            let cell = this.crossword.grid.cells[input.row][input.col];
            input.el.value = '';
            cell.contents = val;
            cell.td.textContent = val;
        }
    }

    handleKeypress(e, isGrid) {
        let input = this.gridInput;
        e.preventDefault();
        this.storeInput(e.key, isGrid);
        this.advanceInput();
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
                td.setAttribute('data-row', row);
                td.setAttribute('data-col', col);
                if (cell.empty) {
                    td.setAttribute('data-empty', '');
                }
                if (cell.number) {
                    td.setAttribute('data-number', cell.number);
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