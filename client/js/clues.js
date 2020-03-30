
export class ClueDisplay {
    constructor(parent) {
        this.parent = parent;
        const self = this;
        const container = document.createElement('div');
        container.classList.add('crossword-clue-container');
        container.onclick = function (e) {
            self.onClick(e);
        };
        parent.appendChild(container);
        this.clueContainer = container;
    }

    addClueList(container, isAcross) {
        const clues = this.crossword.clues;
        const list = document.createElement('ul');

        for (let [clueid, clue] of Object.entries(clues)) {
            if (clue.isAcross == isAcross) {
                const li = document.createElement('li');
                li.textContent = clue.text;
                list.appendChild(li);
            }
        }
        container.appendChild(list);
    }

    setCrossword(crossword, gridTable) {
        this.crossword = crossword;
        const el = this.clueContainer;
        el.style.left = gridTable.offsetLeft + gridTable.clientWidth + 'px';
        el.style.top = gridTable.offsetTop + 'px';
        el.style.height = gridTable.offsetHeight + 'px';

        const self = this;
        [false, true].forEach(function(isAcross) {
            const div = document.createElement('div');
            div.classList.add('crossword-clues');
            if (isAcross) {
                div.dataset.across = ''
            } else {
                div.dataset.down = '';
            }
            self.addClueList(div, isAcross);
            el.appendChild(div);
        });
    }
}