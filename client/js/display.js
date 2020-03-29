

export class CrosswordDisplay {
    constructor(parent) {
        this.parent = parent;
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
        let input = this.gridInput;
        if (target.nodeName == 'TD' && !target.hasAttribute('data-empty')) {
            input.style.display = '';
            input.style.left = target.offsetLeft + 'px';
            input.style.top = target.offsetTop + 'px';

            input.focus();
            input.select();
        }
    }

    createInput() {
        let input = document.createElement('input');
        input.classList.add('crossword-grid-input');
        input.style.display = 'none';
        input.type = 'text';
        this.gridWrapper.appendChild(input);
        this.gridInput = input;
    }

    storeInput() {
        const tds = this.gridWrapper.querySelectorAll('td .accepting-input');
        tds.forEach(function (td) {
            td.textContent = this.gridInput.value;
            td.classList.remove('accepting-input');
        });
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
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        wrapper.appendChild(table);
        this.parent.appendChild(wrapper);
        this.gridWrapper = wrapper;
    }
}