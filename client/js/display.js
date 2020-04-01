import * as KeyCode from 'keycode-js';

import * as parser from './parser.js';

import {GridDisplay} from './grid.js'
import {ClueDisplay} from './clues.js'

function matchesClueId(el, clueid, offset) {
    const idparts = el.dataset.clueid.split(',');
    let offsetparts;
    if (offset !== undefined) {
        offsetparts = el.dataset.offset.split(',');
    }
    for (let i = 0; i < idparts.length; i++) {
        if ((offset === undefined || offsetparts[i] == offset) && idparts[i] == clueid) {
            return true;
        }
    }
    return false;
}

export class CrosswordDisplay {
    constructor(panelContainer, gridContainer, clueContainer, sourceEl, onfillcell) {
        this.parent = gridContainer;
        this.panelContainer = panelContainer;
        this.grid = new GridDisplay(this, gridContainer);
        this.clues = new ClueDisplay(this, clueContainer);
        // to avoid flickering when clearing highlight state
        this.highlightDebounceMs = 50;
        this.highlightCount = {};
        this.sourceEl = sourceEl;
        this.onfillcell = onfillcell;
    }

    clearHighlight(clueid) {
        if (!clueid) {
            return;
        }
        const self = this;
        if (this.highlightCount[clueid]) {
            this.highlightCount[clueid]--;
        }
        setTimeout(() => {
            const selected = self.selectedId;
            if (clueid == selected) {
                return;
            }
            self.parent.querySelectorAll('.highlighted[data-clueid*="'+ clueid +'"]').forEach(
                function (el) {
                    let count = self.highlightCount[clueid];
                    if (!(selected && matchesClueId(el, selected) || count)) {
                        el.classList.remove('highlighted');
                    }
                }
            );
        }, this.highlightDebounceMs);
    }

    drawHighlight(scroll) {
        for (let [clueid, count] of Object.entries(this.highlightCount)) {
            if (count) {
                this.clues.highlightClue(clueid, false);
                this.grid.highlightClue(clueid);
            }
        }
        if (this.selectedId) {
            this.clues.highlightClue(this.selectedId, scroll);
            this.grid.highlightClue(this.selectedId);
        }
    }

    fillCell(clueid, offset, value, forced) {
        const self = this;
        function fill(clueid, offset) {
            let els = self.parent.querySelectorAll(
                '[data-clueid*="'+ clueid +'"][data-offset*="' + offset + '"]'
            );
            els.forEach(function (el) {
                if (!matchesClueId(el, clueid, offset)) {
                    return;
                }
                if (el.nodeName == 'INPUT') {
                    el.value = value;
                } else if (el.nodeName == 'TD') {
                    el.textContent = value;
                }
            });

        }
        const clue = this.crossword.clues[clueid];
        const cell = clue.cells[offset];
        cell.contents = value;
        fill(clueid, offset);
        const intersection = clue.intersections[offset];
        if (intersection) {
            fill(intersection.clueid, intersection.offset);
        }
        if (self.onfillcell && !forced) {
            self.onfillcell(clueid, offset, value);
        }
    }

    selectClue(clueid, scroll) {
        this.clearHighlight(this.selectedId);
        this.selectedId = clueid;
        this.drawHighlight(scroll);
    }

    highlightClue(clueid) {
        if (this.highlightCount[clueid]) {
            this.highlightCount[clueid]++;
        } else {
            this.highlightCount[clueid] = 1;
        }
        this.drawHighlight();
    }

    setCrosswordSource(source) {
        this.sourceEl.value = source;
        this.setCrossword(parser.parse(source));
    }

    setCrossword(crossword) {
        this.crossword = crossword;
        const grid = this.grid;
        grid.setCrossword(crossword);

        const gridTable = grid.gridTable;
        const panels = this.panelContainer;
        panels.style.left = gridTable.offsetLeft + gridTable.clientWidth + 'px';
        panels.style.top = gridTable.offsetTop + 'px';
        panels.style.height = gridTable.offsetHeight + 'px';
        this.clues.setCrossword(crossword);
    }
}
