<template>
<td :data-solver-mask="solverMask"
    :data-number="cell.number"
    :data-across-separator="cell.acrossSeparator"
    :data-down-separator="cell.downSeparator"
    :data-empty="cell.empty"
    :style="{backgroundColor: cell.shadingColor}"
    @click.prevent="$emit('cell-clicked', $event)">
    <input
        v-if="editable && !cell.empty"
        ref="input"
        class="crossword-grid-input"
        :value="cell.contents"
        v-on="$listeners"
        maxlength="1"
    >
    </input>
    <div v-else>
        {{cell.contents}}
    </div>
    <div class="cell-highlight-border" v-if="cell.highlightMask" :style="{borderColor: cell.shadingColor || 'transparent', borderWidth: (cell.shadingColor ? '0.15ch' : '0')}"></div>
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
    

    border-color: $gridBgColor;
    min-width: $gridCellSize;
    max-width: $gridCellSize;
    min-height: $gridCellSize;
    height: $gridCellSize;
    max-height: $gridCellSize;
    position: relative;
    text-align: center;
    vertical-align: baseline;
    border: $gridBorderWidth solid;

    &[data-number]:before {
        position: absolute;
        top: 0;
        left: 0;
        content: attr(data-number);
        font-size: .5em;
        line-height: 1em;
        background-color: rgba(240, 240, 240, 0.7);
        @media print {
            background-color: transparent !important;
        }
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
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        font-family: $answerFontFamily;
        border: 0;
        padding: 0;
        margin: 0;
        background: none;
        outline: none;
        /*font-size: $gridFontSize;*/
        font-size: 90%;
        min-width: 100%;
        max-width: 100%;
        height: 100%;
        line-height: 100%;
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

export default Vue.extend({
  props: {
    cell: Object,
    editable: {
        type: Boolean,
        default: true
    },
  },
  computed: {
    solverMask() {
        let v = (this.cell.acrossMask | this.cell.downMask);
        // can only show 4 overlapping solvers...
        while (nBitsSet(v) > 4) {
            v &= v - 1; // clear the least significant bit set
        }
        return v;
    },
  },
  methods: {
    // onBlur: function() {
    //     let haveFocus = this.$refs.input === document.activeElement;
    //     if (!haveFocus)
    //         this.$emit('blur-cell', this.cell);
    // },
    select() {
        if (!this.editable)
            return;
        this.$refs.input.focus();
        this.$refs.input.select();
    },
  },
  data() {
    return {
      bundler: "Parcel",
    };
  },
});
</script>