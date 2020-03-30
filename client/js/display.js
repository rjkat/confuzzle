import * as KeyCode from 'keycode-js';

import * as parser from './parser.js';

import {GridDisplay} from './grid.js'
import {ClueDisplay} from './clues.js'

export class CrosswordDisplay {
    constructor(parent) {
        this.parent = parent;
        this.grid = new GridDisplay(parent);
        this.clues = new ClueDisplay(parent, this.grid);
        this.grid.clueDisplay = this.clues;
    }

    setCrossword(crossword) {
        const grid = this.grid;
        grid.setCrossword(crossword);
        this.clues.setCrossword(crossword, grid.gridTable);
    }
}