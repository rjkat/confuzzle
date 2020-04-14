import * as KeyCode from 'keycode-js';
const uniqid = require('uniqid');

export class ClueDisplay {
    constructor(cwDisplay, panel) {
        this.cwDisplay = cwDisplay;
        const self = this;
        const container = document.createElement('div');
        container.classList.add('crossword-clue-container');
        panel.appendChild(container);
        this.clueContainer = panel;
        this.scrollContainer = panel.parentNode;
    }

    getClueElement(clueid) {
        return this.clueContainer.querySelector('li[data-clueid="'+ clueid +'"]');
    }

    clearHighlightClue(clueid) {
        const el = this.getClueElement(clueid);
        if (el) {
            el.classList.remove('highlighted');
        }
    }

    highlightClue(clueid, scroll) {
        const el = this.getClueElement(clueid);
        if (scroll) {
            this.scrollContainer.scrollTo({
              top: el.offsetTop,
              behavior: 'smooth'
            });
        }
        el.classList.add('highlighted');
    }

    moveInput(input, direction) {
        const el = input.parentNode;
        const nextoffset = parseInt(input.dataset.offset, 10) + direction;
        const nextinput = el.querySelector(
            'input[data-offset="' + nextoffset + '"]'
        );
        if (nextinput) {
            nextinput.select();
            nextinput.focus();
        } else if (nextoffset >= 0) {
            // only blur when going off the end
            input.blur();
            this.cwDisplay.clearOwnHighlight(input.dataset.clueid);
        }
    }

    onClick(e) {
        if (e.target.nodeName == 'INPUT') {
            const input = e.target;
            e.preventDefault();
            this.cwDisplay.selectClue(input.dataset.clueid);
            input.focus();
            input.select();
        }
    }

    fillCell(input, value) {
        input.value = value;
        this.cwDisplay.fillCell(input.dataset.clueid, input.dataset.offset, value);
    }

    handleKeydown(e) {
        if (e.target.nodeName != 'INPUT') {
            return;
        }
        const input = e.target;
        switch (e.keyCode) {
            case KeyCode.KEY_SPACE:
            case KeyCode.KEY_RIGHT:
            case KeyCode.KEY_DOWN:
                this.moveInput(input, 1);
                e.preventDefault();
                break;
            case KeyCode.KEY_BACK_SPACE:
                this.fillCell(input, '');
            case KeyCode.KEY_LEFT:
            case KeyCode.KEY_UP:
                this.moveInput(input, -1);
                e.preventDefault();
                break;
            case KeyCode.KEY_ESCAPE:
            case KeyCode.KEY_RETURN:
                input.blur();
                this.cwDisplay.clearOwnHighlight(input.dataset.clueid);
                e.preventDefault();
                break;
        }
    }

    handleKeypress(e) {
        if (e.target.nodeName != 'INPUT') {
            return;
        }
        e.preventDefault();
        const input = e.target;
        this.fillCell(input, e.key);
        this.moveInput(input, 1);
    }

    addClueList(container, isAcross) {
        const clues = this.crossword.clues;

        const self = this;
        const list = document.createElement('ul');
        for (let [clueid, clue] of Object.entries(clues)) {
            if (clue.isAcross == isAcross) {
                const li = document.createElement('li');
                const directions = document.createElement('div');
                directions.classList.add('clue-directions');

                const idEl = document.createElement('span');
                idEl.classList.add('clue-id');
                idEl.textContent = clueid + ' ';
                directions.appendChild(idEl);

                const textEl = document.createElement('span');
                textEl.classList.add('clue-text');
                textEl.textContent = clue.text;
                directions.appendChild(textEl);

                const lengthEl = document.createElement('span');
                lengthEl.classList.add('clue-length');
                let lengthstr = ' (';
                for (let i = 0; i < clue.lengths.length; i++) {
                    if (i > 0) {
                        lengthstr += clue.separators[i - 1];
                    }
                    lengthstr += clue.lengths[i];
                }
                lengthstr += ')';
                lengthEl.textContent = lengthstr;
                directions.appendChild(lengthEl);

                li.appendChild(directions);
                const self = this;
                li.onmouseover = () => self.cwDisplay.drawOwnHighlight(clueid);
                li.onmouseout = () => self.cwDisplay.clearOwnHighlight(clueid);
                li.dataset.clueid = clueid;
                li.dataset.solverMask = (1 << self.cwDisplay.solverid);

                const answer = document.createElement('div');
                answer.classList.add('crossword-answer-container');

                let lastInput;

                const inputContainer = document.createElement('div');
                inputContainer.classList.add('crossword-clue-input');
                for (let i = 0; i < clue.totalLength; i++) {
                    const input = document.createElement('input');
                    input.setAttribute('maxlength', 1);
                    input.dataset.clueid = clueid;
                    input.dataset.offset = i;
                    input.onclick = e => self.onClick(e);
                    input.onkeypress = e => self.handleKeypress(e);
                    input.onkeydown = e => self.handleKeydown(e);
                    input.onmousedown = e => e.preventDefault();
                    input.onblur = function () {
                        self.cwDisplay.clearOwnHighlight(clueid);
                    };
                    const cell = clue.cells[i];
                    if (cell.shadingColor) {
                        input.style.backgroundColor = cell.shadingColor;
                    }
                    // clicking on directions is equivalent to clicking first input
                    if (i == 0) {
                        directions.onclick = function(e) {
                            input.click();
                        };
                    }
                    inputContainer.appendChild(input);

                    const separator = clue.isAcross ? cell.acrossSeparator : cell.downSeparator;
                    if (separator) {
                        const sep = document.createElement('span');
                        sep.classList.add('crossword-separator');
                        sep.dataset.separator = separator;
                        inputContainer.appendChild(sep);
                    }
                    lastInput = input;
                }
                if (clue.shadingColor) {
                    inputContainer.style.backgroundColor = clue.shadingColor;
                    inputContainer.style.borderRadius = '5px';
                }
                answer.appendChild(inputContainer);
                li.appendChild(answer);
                list.appendChild(li);
            }
        }
        container.appendChild(list);
    }

    setCrossword(crossword) {
        this.crossword = crossword;
        const el = this.clueContainer;
        el.innerHTML = '';
        const self = this;
        
        const meta = crossword.meta;
        if (meta.note) {
            const note = document.createElement('div');
            note.classList.add('author-note');
            note.textContent = meta.note;
            el.appendChild(note);
        }

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
