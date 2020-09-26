<template>
<div>
  <span class="visible-print">
    <span class="crossword-meta-name">{{crossword.meta.name}}</span>
    <span class="crossword-meta-author">by {{crossword.meta.author}}</span>
    <span class="crossword-meta-identifier" v-if="crossword.meta.identifier">{{crossword.meta.identifier}}</span>
  </span>
  <div class="crossword-grid-container" :style="gridContainerStyle">
    <table class="crossword-grid" cell-spacing="0" :style="gridStyle">
        <tr v-for="(row, r) in crossword.grid.cells">
            <ana-cell v-for="cell in row" ref="inputCells"
                      :cell="crossword.grid.cells[cell.row][cell.col]"
                      :solverid="solverid"
                      @cell-clicked="cellClicked($event, cell)"
                      @keydown="handleKeydown($event, cell)"
                      @input="handleInput($event, cell)"
                      @mousedown.prevent>
            </ana-cell>
        </tr>
    </table>
  </div>
  <div class="copyright-text" v-if="!isPortrait">{{crossword.meta.copyright}}</div>
</div>
</template>

<style lang="scss">
.crossword-grid {
  flex: none;
  text-transform: uppercase;
  background-color: $gridBlankColor;
  display:inline-block;
  border-collapse: collapse;
}
.copyright-text {
  font-family: $clueFontFamily;
}
</style>

<script>
import Vue from "vue";
import * as KeyCode from 'keycode-js';
import AnaCell from './AnaCell.vue'

export default Vue.extend({
  components: {
    AnaCell
  },
  model: {
    prop: 'crossword'
  },
  props: {
    crossword: Object,
    gridSize: Number,
    isPortrait: {
      type: Boolean,
      default: false
    },
    editable: {
      type: Boolean,
      default: true
    },
    solverid: Number
  },
  computed: {
    gridWidth() {
      const ncols = Math.min(this.crossword.grid.width, this.crossword.grid.height);
      return (this.cellWidth * ncols + this.bodyPadding);
    },
    gridStyle() {
      const scale = Math.min(1, this.gridSize / this.gridWidth);
      return {
        'transform': 'scale(' + scale + ')',
        'transform-origin': 'top left',
      }
    },
    gridContainerStyle() {
      return {
        'overflow': 'hidden',
       'height': Math.min(this.gridWidth, this.gridSize) + 'px',
       'width': Math.min(this.gridWidth, this.gridSize) + 'px'
      }
    },
    selectedClue() {
        for (let [clueid, clue] of Object.entries(this.crossword.clues)) {
            if (clue.selected) {
                return clue;
            }
        }
        return undefined;
    }
  },
  watch: {
    selectedClue(newVal, oldVal) {
      if (oldVal) {
        this.hidePopover(oldVal);
      }
      if (newVal) {
        this.showPopover(newVal);
      }
    }
  },
  methods: {
    showPopover(clue) {
      const cell = clue.cells[0];
      const inputCell = this.$refs.inputCells[cell.row*this.crossword.grid.height + cell.col]
      if (inputCell) {
          inputCell.showPopover();
      }
    },
    getInputCell(cell) {
      return this.$refs.inputCells[cell.row*this.crossword.grid.height + cell.col];
    },
    hidePopover(clue) {
       const cell = clue.cells[0];
       const inputCell = this.getInputCell(cell);
       if (inputCell) {
          inputCell.hidePopover();
       }
    },
    deselectCell(cell) {
       const clue = this.inputAcross ? cell.clues.across : cell.clues.down;
       if (clue) {
          clue.deselect(this.solverid);
       }
    },
    selectCell(cell) {
        if (cell.empty)
          return;
        // if the clue can only be either across or down,
        // change to its direction
        if (!(cell.clues.across && cell.clues.down)) {
            this.inputAcross = Boolean(cell.clues.across);
        }
        const clue = this.inputAcross ? cell.clues.across : cell.clues.down;
        clue.select(this.solverid);
        const inputCell = this.getInputCell(cell);
        if (inputCell)
          inputCell.select();
        this.showPopover(clue);
    },
    fillCell(cell) {
      const clue = this.inputAcross ? cell.clues.across : cell.clues.down;
      const offset = this.inputAcross ? cell.offsets.across : cell.offsets.down;
      this.$emit('fill-cell', {clueid: clue.id, offset: offset, value: cell.contents});
    },
    cellClicked(event, cell) {
        if (!this.editable) {
            return;
        }
        // if it's both a down and across clue,
        if (cell.clues && cell.clues.across && cell.clues.down) {

          // if it's the same as the last clicked cell, switch directions
          if (cell == this.lastClicked) {
            this.inputAcross = !this.inputAcross;
          // clicked on a first letter, change direction to match
          // the clue with the first letter
          } else if (cell.offsets.across == 0 || cell.offsets.down == 0) {
            this.inputAcross = cell.offsets.across == 0;
          }
        }
        this.lastClicked = cell;
        this.selectCell(cell);
    },
    moveInputCell(input, cell, direction) {
        let row, col;
        const cells = this.crossword.grid.cells;
        this.deselectCell(cell);
        if (this.inputAcross) {
            row = cell.row;
            col = cell.col + direction;
        } else {
            row = cell.row + direction;
            col = cell.col;
        }
        const backspace = direction == -1;
        // we've run off the end or hit an empty square
        if (   row < 0 || row >= cells.length
            || col < 0 || col >= cells[row].length
            || cells[row][col].empty) {
            // make it so that backspace doesn't hide the input
            if (!backspace) {
                this.deselectCell(cell);
                input.blur();
            }
            return;
        }
        cell = cells[row][col];
        // if the clue can only be either across or down,
        // change to its direction
        if (!(cell.clues.across && cell.clues.down)) {
            this.inputAcross = Boolean(cell.clues.across);
        }
        this.selectCell(cell);
    },
    handleInput(e, cell) {
        cell.contents = e.target.value;
        this.fillCell(cell);
        if (cell.contents)
        {
          this.moveInputCell(e.target, cell, 1);
        }
    },
    handleKeydown(e, cell) {
        switch (e.keyCode) {
            case KeyCode.KEY_SPACE:
            case KeyCode.KEY_RIGHT:
            case KeyCode.KEY_DOWN:
                this.moveInputCell(e.target, cell, 1);
                break;
            case KeyCode.KEY_BACK_SPACE:
                cell.contents = '';
                this.fillCell(cell);
            case KeyCode.KEY_LEFT:
            case KeyCode.KEY_UP:
                this.moveInputCell(e.target, cell, -1);
                break;
            case KeyCode.KEY_ESCAPE:
            case KeyCode.KEY_RETURN:
                this.deselectCell(cell);
                e.target.blur();
                break;
        }
    },
  },
  data() {
    return {
      bundler: "Parcel",
      inputAcross: true,
      lastClicked: undefined,
      cellWidth: 29,
      bodyPadding: 18,
    };
  }
});
</script>
