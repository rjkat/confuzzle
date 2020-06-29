<template>
<div>
  <table class="crossword-grid" cell-spacing="0">
      <tr v-for="(row, r) in crossword.grid.cells">
          <ana-cell v-for="cell in row" ref="inputCells"
                    v-model="crossword.grid.cells[cell.row][cell.col]"
                    @click.prevent="cellClicked($event, cell)"
                    @keypress.prevent="handleKeypress($event, cell)"
                    @keydown="handleKeydown($event, cell)"
                    @mousedown.prevent
                    @change-input-direction="changeInputDirection($event)">
          </ana-cell>
      </tr>
  </table>
</div>
</template>

<style lang="scss">
.crossword-grid {
    text-transform: uppercase;
    background-color: $gridBlankColor;
    display:inline-block;
    border-collapse: collapse;
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
    editable: {
      type: Boolean,
      default: true
    },
  },
  methods: {
    selectCell(cell) {
        if (cell.empty)
          return;
        // if the clue can only be either across or down,
        // change to its direction
        if (!(cell.clues.across && cell.clues.down)) {
            this.inputAcross = Boolean(cell.clues.across);
        }
        const inputCell = this.$refs.inputCells[cell.row*this.crossword.grid.height + cell.col]
        if (inputCell)
          inputCell.select();
    },
    cellClicked(event, cell) {
        if (!this.editable) {
            return;
        }
        // if it's both a down and across clue, and they've
        // clicked on a first letter, change direction to match
        // the clue with the first letter
        if (cell.clues && cell.clues.across && cell.clues.down
            && (cell.offsets.across == 0 || cell.offsets.down == 0)) {
            this.inputAcross = !this.inputAcross;
        }
        this.selectCell(cell);
    },
    moveInputCell(input, cell, direction) {
        let row, col;
        const cells = this.crossword.grid.cells;
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
    handleKeypress(e, cell) {
        e.preventDefault();
        cell.contents = e.key;
        this.moveInputCell(e.target, cell, 1);
    },
    handleKeydown(e, cell) {
        switch (e.keyCode) {
            case KeyCode.KEY_SPACE:
            case KeyCode.KEY_RIGHT:
            case KeyCode.KEY_DOWN:
                this.moveInputCell(e.target, cell, 1);
                break;
            case KeyCode.KEY_BACK_SPACE:
                e.preventDefault();
                cell.contents = '';
            case KeyCode.KEY_LEFT:
            case KeyCode.KEY_UP:
                this.moveInputCell(e.target, cell, -1);
                break;
            case KeyCode.KEY_ESCAPE:
            case KeyCode.KEY_RETURN:
                e.target.blur();
                break;
        }
    },
  },
  data() {
    return {
      bundler: "Parcel",
      inputAcross: true
    };
  }
});
</script>
