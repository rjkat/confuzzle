function getCellNumber(row, col, clues) {
    for (let [clueid, clue] of Object.entries(clues)) {
        if (clue.col == col && clue.row == row) {
            return clueid.slice(0, -1);
        }
    }
    return undefined;
}

export class CrosswordDisplay {
    constructor(parent) {
        this.parent = parent;
    }

    setCrossword(crossword) {
        this.crossword = crossword;
        this.parent.innerHTML = ""
        this.buildGrid();
    }

    buildGrid() {
        let parent = this.parent;
        let clues = this.crossword.clues;
        let grid = this.crossword.grid;
        let table = document.createElement('table');
        table.classList.add('crossword-grid-table');
        for (let row = 1; row <= grid.height; row++) {
            const tr = document.createElement('tr');
            for (let col = 1; col <= grid.width; col++) {
                const num = getCellNumber(row, col, clues);
                const td = document.createElement('td');
                td.setAttribute('data-row', row);
                td.setAttribute('data-col', col);
                if (num) {
                    td.setAttribute('data-number', num);
                }
                td.textContent = num ? num : ".";
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }
        parent.appendChild(table);
        this.gridTable = table;
    }
}