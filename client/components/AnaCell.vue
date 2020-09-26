<template>
<td :data-solver-mask="solverMask"
    :data-number="cell.number"
    :data-across-separator="cell.acrossSeparator"
    :data-down-separator="cell.downSeparator"
    :data-empty="cell.empty"
    :style="{backgroundColor: cell.shadingColor}"
    @click.prevent="onClick($event)"
    ref="tableCell"
    >
    <div v-if="!cell.empty && (
                 (cell.clues.across && cell == cell.clues.across.cells[0]) || 
                 (cell.clues.down && cell == cell.clues.down.cells[0])
               )"
        class="cell-tooltip" ref="tooltip">
        {{tooltipText}}
        <div class="cell-tooltip-arrow" data-popper-arrow></div>
    </div>
    <template v-if="editable && !cell.empty">
        <input
            ref="input"
            class="crossword-grid-input"
            :value="cell.contents"
            v-on="$listeners"
            maxlength="1"
        >
        </input>
    </template>
    <template v-else>
        <div>{{cell.contents}}</div>
    </template>
    <div class="cell-highlight-border" v-if="cell.highlightMask" :style="{borderColor: cell.shadingColor || 'transparent', borderWidth: (cell.shadingColor ? '0.15ch' : '0')}"></div>
</td>
</template>

<style lang="scss">
.cell-tooltip {
    padding: 4px 8px;
    font-size: 13px;
    text-transform: none;
    white-space: nowrap;
    z-index: 10;
    background: #333;
    color: #fff;
    border-radius: 4px;
    font-family: $clueFontFamily;
    display: none;

    &[data-show] {
        display: block !important;
    }
}
.cell-tooltip-arrow,
.cell-tooltip-arrow::before {
  position: absolute;
  width: 8px;
  height: 8px;
  z-index: -1;
}

.cell-tooltip-arrow::before {
  content: '';
  transform: rotate(45deg);
  background: #333;
}

.cell-tooltip[data-popper-placement^='top'] > .cell-tooltip-arrow {
  bottom: -4px;
}

.cell-tooltip[data-popper-placement^='bottom'] > .cell-tooltip-arrow {
  top: -4px;
}

.cell-tooltip[data-popper-placement^='left'] > .cell-tooltip-arrow {
  right: -4px;
}

.cell-tooltip[data-popper-placement^='right'] > .cell-tooltip-arrow {
  left: -4px;
}
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
import { createPopper } from '@popperjs/core';

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
    }
  },
  watch: {
    cell(val) {
        if (this.popper)
            this.popper.destroy();
        Vue.nextTick(() => this.createPopper());
    }
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
    tooltipText() {
        var text = '';
        if (!this.cell.clues)
            return text;
        const acrossClue = this.cell.clues.across;
        const downClue = this.cell.clues.down;
        if (acrossClue)
            text = acrossClue.plainText;
        if (downClue && (!acrossClue || downClue.selected))
            text = downClue.plainText
        return text;
    }
  },
  methods: {
    createPopper() {
        if (!this.$refs.tooltip)
            return;

        Vue.nextTick(() => {
            this.popper = createPopper(this.$refs.input, this.$refs.tooltip, {
              placement: 'top',
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, 5],
                  },
                },
                {
                  name: 'preventOverflow',
                  options: {
                    boundary: this.$refs.tableCell.parentElement.parentElement
                  }
                }
              ],
            });
        });
    },
    onClick(event) {
        this.$emit('cell-clicked', event);
    },
    showPopover() {
        if (this.$refs.tooltip);
            this.$refs.tooltip.setAttribute('data-show', '');

        if (this.popper)
            this.popper.update();
    },
    hidePopover() {
        if (this.$refs.tooltip)
            this.$refs.tooltip.removeAttribute('data-show');
        if (this.popper)
            this.popper.update();
    },
    select() {
        if (!this.editable)
            return;
        
        if (document.activeElement !== this.$refs.input) {
            this.$refs.input.focus();
            this.$refs.input.select();
        }
    },
  },
  mounted() {
    this.createPopper();
  },
  data() {
    return {
      bundler: "Parcel",
      popper: null
    };
  },
});
</script>