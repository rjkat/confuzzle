<template>
<td :data-row="cell.row"
    :data-col="cell.col"
    :data-solver-mask="solverMask"
    :data-number="cell.number"
    :data-across-separator="cell.acrossSeparator"
    :data-down-separator="cell.downSeparator">
    <span>{{cell.contents}}</span>
    <div class="cell-highlight-border"></div>
</td>
</template>

<style lang="scss">
@import "../stylesheets/_variables.scss";

.cell-highlight-border {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;

    background-clip: padding-box;
    background-color: transparent;
    border-width: 0;
    border-style: solid;
    border-color: transparent;
}

td {
    font-size: $gridFontSize;
    box-sizing: border-box;
    font-family: $answerFontFamily;
    border: $gridBorderWidth solid;
    border-color: $gridBgColor;
    min-width: $gridCellSize;
    max-width: $gridCellSize;
    min-height: $gridCellSize;
    height: $gridCellSize;
    max-height: $gridCellSize;
    line-height: 1ch;
    position: relative;
    text-align: center;
    vertical-align: middle;

    &[data-number]:before {
        position: absolute;
        top: 0;
        left: 0;
        content: attr(data-number);
        font-size: .5em;
        line-height: 1em;
        background-color: rgba(240, 240, 240, 0.7);
        z-index: 5;
    }

    &[data-across-separator]:after {
        content: '';
        height: $gridCellSize;
        position: absolute;
        right: 0;
        top: 0;
        border-right: 3px #000 solid;
    }

    &[data-down-separator]:after {
        content: '';
        width: $gridCellSize;
        position: absolute;
        right: 0;
        bottom: 0;
        border-bottom: 3px #000 solid;
    }

    &[data-empty] {
        background: $gridBgColor;
    }
}
</style>

<script>
import Vue from "vue";
import * as KeyCode from 'keycode-js';

// https://graphics.stanford.edu/~seander/bithacks.html
function nBitsSet(v) {
    let n = 0;
    while (v) {
        n++;
        v &= v - 1; // clear the least significant bit set
    }
    return n;
}

function clearSolverMask(td, solverid, clearAcross, clearDown) {
    if (!td) {
        return;
    }
    if (clearAcross) {
        td.dataset.acrossMask &= ~(1 << solverid);
    }
    if (clearDown) {
        td.dataset.downMask &= ~(1 << solverid);
    }
    td.dataset.solverMask = (td.dataset.acrossMask | td.dataset.downMask);
}

export default Vue.extend({
  components: {
  },
  props: {
    cell: Object
  },
  computed: {
    solverMask: function () {
        let v = (this.cell.acrossMask | this.cell.downMask);
        // can only show 4 overlapping solvers...
        while (nBitsSet(v) > 4) {
            v &= v - 1; // clear the least significant bit set
        }
        return v;
    }
  },
  methods: {
    onClick(event) {
        const cell = this.cell;
        // if it's both a down and across clue, and they've
        // clicked on a first letter, change direction to match
        // the clue with the first letter
        if (cell.clues.across && cell.clues.down
            && (cell.offsets.across == 0 || cell.offsets.down == 0)) {
            this.$emit('change-input-direction');
        }
        this.$emit('set-input-cell', {row: cell.row, col: cell.col});
    },
    highlight(solverid, isAcross) {
        if (isAcross) {
            this.cell.acrossMask |= (1 << solverid);
        } else {
            this.cell.downMask |= (1 << solverid);
        }
    }
  },
  data() {
    return {
      bundler: "Parcel"
    };
  },
});
</script>