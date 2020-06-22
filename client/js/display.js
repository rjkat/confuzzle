import * as KeyCode from 'keycode-js';

import * as parser from './parser.js';

import {GridDisplay} from './grid.js';
import {ClueDisplay} from './clues.js';

// https://github.com/joshuakgoldberg/emojisplosion/blob/HEAD/src/emojis.ts 
export const defaultEmojis = [
    "😁",
    "😂",
    "🤣",
    "😃",
    "😅",
    "😆",
    "😍",
    "🤩",
    "😎",
    "🤔",
    "😒",
    "😭",
    "😱",
    "🤖",
    "😻",
    "🙀",
    "🙈",
    "🙉",
    "🙊",
    "🏄",
    "💪",
    "👌",
    "👋",
    "🙌",
    "💝",
    "💖",
    "💗",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🚀",
    "⛄",
    // These emoji are extra fun, so they get twice the inclusion!
    "🔥",
    "🔥",
    "✨",
    "✨",
    "🎉",
    "🎉",
    "💯",
    "💯",
];

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

function gridComplete(grid) {
    for (let row = 0; row < grid.height; row++) {
        for (let col = 0; col < grid.width; col++) {
            if (!grid.cells[row][col].empty
                && grid.cells[row][col].contents == '') {
                return false;
            }
        }
    }
    return true;
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

    isSelected(clueid) {
        if (clueid == this.selectedid) {
            return true;
        }
        const refs = this.crossword.clues[clueid].refIds;
        if (refs) {
            for (var i = 0; i < refs.length; i++) {
                if (refs[i] == this.selectedid) {
                    return true;
                }
            }
        }
        return false;
    }
    clearOwnHighlight(clueid, force) {
        if (!clueid) {
            return;
        }
        if (force || !this.isSelected(clueid)) {
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
            let els = document.querySelectorAll(
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
        // if (gridComplete(this.crossword.grid)) {
            if (!this.explosions) {
                if (this.crossword.meta.emoji && this.crossword.meta.emoji.length > 0) {
                    console.log(this.crossword.meta.emoji);
                    this.explosions = emojisplosions({emojis: defaultEmojis.concat(this.crossword.meta.emoji)});
                } else {
                    this.explosions = emojisplosions();
                }
            }
        // } else if (this.explosions) {
        //     this.explosions.cancel();
        // }
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

        document.getElementById('crossword-title').style.maxWidth = gridTable.clientWidth + 'px';
        document.getElementById('crossword-content').style.maxHeight = gridTable.clientHeight + 'px';
        // document.querySelectorAll('.crossword-panel').forEach(el => {
        //     el.style.height = (gridTable.clientHeight - 2) + 'px';
        //     el.style.maxHeight = (gridTable.clientHeight - 2) + 'px';
        //     el.style.minWidth = gridTable.clientWidth + 'px';
        // });

        // document.querySelectorAll('#compile-panel-wrapper').forEach(el => {
        //     el.style.height = gridTable.clientHeight + 'px';
        //     el.style.maxHeight = gridTable.clientHeight + 'px';
        // });

        // // todo: remove hardcoded tab height and border width
        // const compileHeight = gridTable.clientHeight - 42;
        // document.querySelectorAll('.compile-panel').forEach(el => {
        //     el.style.height = compileHeight + 'px';
        //     el.style.maxHeight = compileHeight + 'px';
        //     el.style.minWidth = gridTable.clientWidth + 'px';
        // });
        // panels.style.top = gridTable.offsetTop + 'px';
        // panels.style.height = gridTable.offsetHeight + 'px';
        this.clues.setCrossword(crossword);
    }
}
