import * as KeyCode from 'keycode-js';

import * as parser from './parser.js';

import {GridDisplay} from './grid.js'
import {ClueDisplay} from './clues.js'

export class CrosswordDisplay {
    constructor(parent) {
        this.parent = parent;
        this.grid = new GridDisplay(this);
        this.clues = new ClueDisplay(this);
    }

    highlightClue(clue, scroll) {
        this.clearHighlight();
        this.clues.highlightClue(clue, scroll);
        this.grid.highlightClue(clue);
    }

    clearHighlight() {
        this.parent.querySelectorAll('.highlighted').forEach(
            el => el.classList.remove('highlighted')
        );
    }

    setCrossword(crossword) {
        const grid = this.grid;
        grid.setCrossword(crossword);
        this.clues.setCrossword(crossword, grid.gridTable);
    }
}