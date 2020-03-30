import * as KeyCode from 'keycode-js';

import * as parser from './parser.js';

import {GridDisplay} from './grid.js'
import {ClueDisplay} from './clues.js'

export class CrosswordDisplay {
    constructor(parent) {
        this.parent = parent;
        this.grid = new GridDisplay(this);
        this.clues = new ClueDisplay(this);
        // to avoid flickering when clearing highlight state
        this.highlightDebounceMs = 50;
    }

    clearHighlight(clue) {
        if (!clue) {
            return;
        }
        const self = this;
        setTimeout(() => {
            const selected = self.selectedClue;
            const highlighted = self.highlightedClue;
            if (clue == selected || clue == highlighted) {
                console.log("ignore clearHighlight " + clue.id);
                return;
            }
            console.log("clearHighlight " + clue.id);
            self.parent.querySelectorAll('.highlighted[data-clueid*="'+ clue.id +'"]').forEach(
                function (el) {
                    let clueid = el.dataset.clueid;
                    if (!(selected && clueid.includes(selected.id)
                           || highlighted && clueid.includes(highlighted.id))) {
                        el.classList.remove('highlighted');
                    }
                }
            );
        }, this.highlightDebounceMs);
    }

    drawHighlight(scroll) {
        if (this.highlightedClue) {
            this.clues.highlightClue(this.highlightedClue, false);
            this.grid.highlightClue(this.highlightedClue);
        }
        if (this.selectedClue) {
            this.clues.highlightClue(this.selectedClue, scroll);
            this.grid.highlightClue(this.selectedClue);
        }
    }

    selectClue(clue, scroll) {
        if (clue == this.selectedClue) {
            return;
        }
        this.deselectClue();
        this.selectedClue = clue;
        this.drawHighlight(scroll);
    }

    deselectClue() {
        this.clearHighlight(this.selectedClue);
        this.selectedClue = undefined;
    }

    highlightClue(clue) {
        if (clue == this.highlightedClue) {
            return;
        }
        this.highlightedClue = clue;
        this.drawHighlight();
    }

    unhighlightClue() {
        this.clearHighlight(this.highlightedClue);
        this.highlightedClue = undefined;
    }

    setCrossword(crossword) {
        const grid = this.grid;
        grid.setCrossword(crossword);
        this.clues.setCrossword(crossword, grid.gridTable);
    }
}