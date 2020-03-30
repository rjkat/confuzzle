
export class ClueDisplay {
    constructor(cwDisplay) {
        this.cwDisplay = cwDisplay;
        const self = this;
        const container = document.createElement('div');
        container.classList.add('crossword-clue-container');
        cwDisplay.parent.appendChild(container);
        this.clueContainer = container;
    }

    getClueElement(clueid) {
        return this.clueContainer.querySelector('li[data-clueid="'+ clueid +'"]');
    }

    highlightClue(clue, scroll) {
        const el = this.getClueElement(clue.id);
        if (scroll) {
            this.clueContainer.scrollTo({
              top: el.offsetTop,
              behavior: 'smooth'
            });
        }
        el.classList.add('highlighted');
    }

    addClueList(container, isAcross) {
        const clues = this.crossword.clues;
        const list = document.createElement('ul');

        for (let [clueid, clue] of Object.entries(clues)) {
            if (clue.isAcross == isAcross) {
                const li = document.createElement('li');
                li.innerHTML = '<span class="clue-id">' + clueid + '</span>';
                li.innerHTML += ' ' + '<span class="clue-text">' + clue.text + '</span>';
                const self = this;
                li.onmouseover = function (e) {
                    self.cwDisplay.highlightClue(clue);
                };
                li.onmouseout = function (e) {
                    self.cwDisplay.clearHighlight();
                };
                li.dataset.clueid = clueid;

                const answer = document.createElement('div');
                answer.classList.add('crossword-answer-container');
                for (let i = 0; i < clue.totalLength; i++) {
                    const input = document.createElement('input');
                    input.setAttribute('maxlength', 1);
                    answer.appendChild(input);
                }
                li.appendChild(answer);
                list.appendChild(li);
            }
        }
        container.appendChild(list);
    }

    setCrossword(crossword, gridTable) {
        this.crossword = crossword;
        const el = this.clueContainer;
        el.innerHTML = '';
        el.style.left = gridTable.offsetLeft + gridTable.clientWidth + 'px';
        el.style.top = gridTable.offsetTop + 'px';
        el.style.height = gridTable.offsetHeight + 'px';

        const self = this;
        [true, false].forEach(function(isAcross) {
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