import * as KeyCode from 'keycode-js';

import * as parser from './parser.js';

import {GridDisplay} from './grid.js';
import {ClueDisplay} from './clues.js';

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
    constructor(els, callbacks) {
        this.els = els;
        this.grid = new GridDisplay(this, els.gridContainer);
        this.clues = new ClueDisplay(this, els.clueContainer);
        // to avoid flickering when clearing highlight state
        this.highlightDebounceMs = 50;
        this.sourceTextArea = els.sourceTextArea;
        this.callbacks = callbacks;
        this.solverid = 0;
    }

    clearOwnHighlight(clueid, force) {
        if (!clueid) {
            return;
        }
        if (force || clueid != this.selectedid) {
            this.clues.clearHighlightClue(clueid);
            this.grid.clearHighlightClue(clueid, this.solverid);
        }
    }

    drawOwnHighlight(clueid, scroll) {
        if (!clueid) {
            return
        }
        this.clues.highlightClue(clueid, scroll);
        this.grid.highlightClue(clueid, this.solverid);
    }

    fillCell(clueid, offset, value, forced) {
        const self = this;
        function fill(clueid, offset) {
            let els = self.els.gridContainer.querySelectorAll(
                '[data-clueid*="'+ clueid +'"][data-offset*="' + offset + '"]'
            );
            els.forEach(function (el) {
                if (!matchesClueId(el, clueid, offset)) {
                    return;
                }
                if (el.nodeName == 'INPUT') {
                    el.value = value;
                } else if (el.nodeName == 'TD') {
                    el.firstChild.textContent = value;
                }
            });

        }
        const clue = this.crossword.clues[clueid];
        const cell = clue.cells[offset];
        cell.contents = value;
        fill(clueid, offset);
        if (clue.intersections) {
            const intersection = clue.intersections[offset];
            if (intersection) {
                fill(intersection.clueid, intersection.offset);
            }
        }
        if (this.callbacks.onFillCell && !forced) {
            this.callbacks.onFillCell(this.solverid, clueid, offset, value);
        }
    }

    // remote solver has changed their selection
    selectionChanged(msg) {
        if (msg.selected) {
            this.grid.highlightClue(msg.clueid, msg.solverid);
        } else {
            this.grid.clearHighlightClue(msg.clueid, msg.solverid);
        }
    }

    // local solver has changed their selection
    selectClue(clueid, scroll) {
        this.callbacks.onSelectionChanged(false, this.solverid, this.selectedid);
        this.clearOwnHighlight(this.selectedid, true);
        this.selectedid = clueid;
        this.drawOwnHighlight(this.selectedid, scroll);
        this.callbacks.onSelectionChanged(true, this.solverid, this.selectedid);
    }

    setCrossword(crossword) {
        this.crossword = crossword;
        const grid = this.grid;
        grid.setCrossword(crossword);

        const gridTable = grid.gridTable;
        const panels = this.els.panelContainer;
        panels.style.left = gridTable.offsetLeft + gridTable.clientWidth + 'px';
        panels.style.top = gridTable.offsetTop + 'px';
        panels.style.height = gridTable.offsetHeight + 'px';
        this.clues.setCrossword(crossword);
    }
}
