<template>
<div>
  <span class="visible-print">
    <span class="crossword-meta-name">{{crossword.meta.name}}</span>
    <span class="crossword-meta-author">by {{crossword.meta.author}}</span>
    <span class="crossword-meta-identifier" v-if="crossword.meta.identifier">{{crossword.meta.identifier}}</span>
  </span>
  
  <div class="crossword-grid-container" :style="gridContainerStyle">
      <transition name="anagram">
        <div v-if="!showScratchpad" key="grid">
          <table class="crossword-grid" cell-spacing="0" :style="gridStyle">
              <tr v-for="(row, r) in crossword.grid.cells">
                  <cfz-cell v-for="cell in row" ref="inputCells"
                            :cell="crossword.grid.cells[cell.row][cell.col]"
                            :solverid="solverid"
                            @cell-clicked="cellClicked($event, cell)"
                            @keydown="handleKeydown($event, cell)"
                            @input="handleInput($event, cell)"
                            @mousedown.prevent>
                  </cfz-cell>
              </tr>
          </table>
        </div>
        <cfz-scratchpad v-else key="scratchpad" name="scratchpad" :answerSlots.sync="answerSlots" :workingLetters.sync="workingLetters" class="crossword-scratchpad" :clue="selectedClue && selectedClue.primary ? selectedClue.primary : selectedClue" @submit-decrypt="submitDecrypt($event)" :solverid="solverid" :usingPencil="usingPencil" ref="scratchpad">
        </cfz-scratchpad>
        
      </transition>
      
  </div>
</div>
</template>

<style lang="scss">
.crossword-scratchpad {
  height: calc(100% - #{2 * $displayPadding});
  width: calc(100% - #{2 * $displayPadding});
  flex: none;
}
.crossword-grid {
  flex: none;
  text-indent: 0;
  text-transform: uppercase;
  background-color: $gridBgColor;
  display: inline-block;
  border-collapse: collapse;
}

.anagram-enter-active,
.anagram-leave-active {
  transition: opacity 0.5s;
}

.anagram-enter, .anagram-leave-to {
  height: 0px;
  opacity: 0;
}
</style>

<script>
import Vue from "vue";
import * as KeyCode from 'keycode-js';
import CfzCell from './CfzCell.vue'
import CfzScratchpad from './CfzScratchpad.vue'

export default Vue.extend({
  components: {
    CfzCell,
    CfzScratchpad
  },
  model: {
    prop: 'crossword'
  },
  props: {
    crossword: Object,
    usingPencil: Boolean,
    showScratchpad: Boolean,
    answerSlots: {
      type: Object,
      default: function () { return {} }
    },
    workingLetters: {
      type: Object,
      default: function () { return {} }
    },
    gridSize: Number,
    isPortrait: {
      type: Boolean,
      default: false
    },
    editable: {
      type: Boolean,
      default: true
    },
    solverid: Number,
    showTooltips: Boolean
  },
  computed: {
    gridWidth() {
      return (this.cellWidth * this.crossword.grid.width + 2 * this.bodyPadding);
    },
    gridHeight() {
      return (this.cellWidth * this.crossword.grid.height + 2* this.bodyPadding);
    },
    gridScale() {
      const scaleDim = this.isPortrait ? this.gridHeight : this.gridWidth;
      return Math.min(1, this.gridSize / scaleDim);
    },
    gridStyle() {
      return {
        'transform': 'scale(' + this.gridScale + ')',
        'transform-origin': 'top left',
      }
    },
    gridContainerStyle() {
      return {
       'height': this.gridScale * this.gridHeight + 'px',
       'width': this.gridScale * this.gridWidth + 'px'
      }
    },
    gridControlStyle() {
      return {
        'display': 'flex',
        'justify-content': 'space-between',
        'align-items': 'center',
        'width': this.gridScale * this.gridWidth + 'px'
      }
    },
    gridTopControlStyle() {
      return {
        'display': 'flex',
        'position': 'fixed',
        'justify-content': 'space-between',
        'align-items': 'center',
        'margin-top': '-4pt',
        'font-size': '8pt',
       'width': this.gridScale * this.gridWidth + 'px'
      }
    },
    selectedClue() {
        for (let [clueid, clue] of Object.entries(this.crossword.clues)) {
            if (clue.selected) {
                return clue;
            }
        }
        return undefined;
    },
  },
  watch: {
    selectedClue(newVal, oldVal) {
      if (oldVal) {
        this.hidePopover(oldVal);
      }
      if (newVal) {
        this.showPopover(newVal);
      }
    },
    showTooltips(newVal, oldVal) {
      if (!this.selectedClue) {
        return;
      }
      if (!newVal) {
        this.hidePopover(this.selectedClue);
      } else {
        this.showPopover(this.selectedClue);
      }
    },
  },
  methods: {
    dropTile(fromAnswer, offset, letter, target) {
      if (this.$refs.scratchpad) {
        this.$refs.scratchpad.dropTile(fromAnswer, offset, letter, target);
      }
    },
    showPopover(clue) {
      if (!clue)
        return;
      const inputCell = this.getInputCell(clue.cells[0]);
      if (inputCell && (this.showTooltips || this.isPortrait)) {
          inputCell.showPopover();
      }
    },
    getInputCell(cell) {
      return this.$refs.inputCells[cell.row*this.crossword.grid.width + cell.col];
    },
    hidePopover(clue) {
       if (!clue)
        return;
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
    },
    submitDecrypt(answer) {
      let i = 0;
      let clue = answer.clue;
      let j = 0;
      const special = this.usingPencil ? '?' : '-';
      while (i < answer.text.length && clue) {
        const cell = clue.cells[j];
        if (answer.text[i]) {
          cell.contents = answer.text[i];
          cell.special = special;
          this.$emit('fill-cell', {clueid: clue.id, offset: j, value: cell.contents, special: special});
        }
        i++;
        j++;
        if (j >= clue.cells.length) {
          clue.showCorrect = false;
          clue.showIncorrect = false;
          clue = clue.nextRef;
          j = 0;
        }
      }
    },
    fillCell(cell, value) {
      cell.contents = value;

      const clue = this.inputAcross ? cell.clues.across : cell.clues.down;
      const offset = this.inputAcross ? cell.offsets.across : cell.offsets.down;
      cell.special = (this.usingPencil && value && value != ' ') ? '?' : '-';
      clue.showCorrect = false;
      clue.showIncorrect = false;
      this.$emit('fill-cell', {clueid: clue.id, offset: offset, value: cell.contents, special: cell.special});
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
              if (this.selectedClue && this.selectedClue.nextRef) {
                  const next = this.selectedClue.nextRef;
                  this.inputAcross = next.isAcross;
                  this.selectCell(next.cells[0]);
              } else {
                this.deselectCell(cell);
              }
            }
            return;
        }

        if (!backspace)
          this.deselectCell(cell);
        cell = cells[row][col];
        // if the clue can only be either across or down,
        // change to its direction
        if (!(cell.clues.across && cell.clues.down)) {
            this.inputAcross = Boolean(cell.clues.across);
        }
        this.selectCell(cell);
    },
    handleInput(e, cell) {
        this.fillCell(cell, e.target.value);
        if (cell.contents)
        {
          this.moveInputCell(e.target, cell, 1);
        }
    },
    handleKeydown(e, cell) {
        switch (e.keyCode) {
            case KeyCode.KEY_SPACE:
                cell.contents = '';
                this.moveInputCell(e.target, cell, 1);
                e.preventDefault();
                break;
            case KeyCode.KEY_RIGHT:
            case KeyCode.KEY_DOWN:
                if (cell.clues.across && cell.clues.down) {
                    if (   (this.inputAcross && e.keyCode == KeyCode.KEY_DOWN)
                        || (!this.inputAcross && e.keyCode == KeyCode.KEY_RIGHT)) {
                      this.inputAcross = !this.inputAcross;
                    }
                }
                this.moveInputCell(e.target, cell, 1);
                break;
            case KeyCode.KEY_BACK_SPACE:
                this.fillCell(cell, '');
            case KeyCode.KEY_LEFT:
            case KeyCode.KEY_UP:
                if (cell.clues.across && cell.clues.down) {
                    if (   (this.inputAcross && e.keyCode == KeyCode.KEY_UP)
                        || (!this.inputAcross && e.keyCode == KeyCode.KEY_LEFT)) {
                      this.inputAcross = !this.inputAcross;
                    }
                }
                this.moveInputCell(e.target, cell, -1);
                e.preventDefault();
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
      bodyPadding: 8
    };
  }
});
</script>
