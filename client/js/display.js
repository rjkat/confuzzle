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
    constructor(parent) {
        this.parent = parent;
        this.grid = new GridDisplay(this);
        this.clues = new ClueDisplay(this);
        // to avoid flickering when clearing highlight state
        this.highlightDebounceMs = 50;
        this.highlightCount = {};
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
                    let clueid = el.dataset.clueid;
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

    fillCell(clueid, offset, value) {
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
        clue.cells[offset].contents = value;
        fill(clueid, offset);
        const intersection = clue.intersections[offset];
        if (intersection) {
            fill(intersection.clueid, intersection.offset);
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
            this.highlightCount[clueid] = 0;
        }
        this.drawHighlight();
    }

    setCrossword(crossword) {
        this.crossword = crossword;
        const grid = this.grid;
        grid.setCrossword(crossword);
        this.clues.setCrossword(crossword, grid.gridTable);
    }
}
