<template>
<td :data-solver-mask="solverMask"
    :data-number="cell.number"
    :data-across-separator="cell.acrossSeparator"
    :data-down-separator="cell.downSeparator"
    :data-empty="cell.empty"
    v-on="$listeners">
    <input
        v-if="editable && !cell.empty"
        ref="input"
        class="crossword-grid-input"
        v-model="cell.contents"
        maxlength="1"
        @input="fillCell($event)"
    >
    </input>
    <span v-else>{{cell.contents}}<div class="cell-highlight-border"></div></span>
</td>
</template>

<style lang="scss">
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

    .crossword-grid-input {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        font-size: $gridFontSize;
        font-family: $answerFontFamily;
        border: 0;
        background: none;
        outline: none;
        min-width: $gridCellSize;
        max-width: $gridCellSize;
        height: $gridCellSize;
        line-height: $gridCellSize;
        position: absolute;
        text-align: center;
        vertical-align: middle;
        text-transform: inherit;
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
  props: {
    cell: Object,
    editable: {
        type: Boolean,
        default: true
    }
  },
  model: {
    prop: 'cell'
  },
  computed: {
    solverMask: function () {
        let v = (this.cell.acrossMask | this.cell.downMask);
        // can only show 4 overlapping solvers...
        while (nBitsSet(v) > 4) {
            v &= v - 1; // clear the least significant bit set
        }
        return v;
    },
  },
  methods: {
    fillCell(event) {
        const cell = this.cell;
        this.$emit('fill-cell', {row: cell.row, col: cell.col, value: event.target.value});
    },
    select() {
        if (!this.editable)
            return;
        this.$refs.input.focus();
        this.$refs.input.select();
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
      bundler: "Parcel",
    };
  },
});
</script>