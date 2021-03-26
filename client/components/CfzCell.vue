<template>
<td :data-solver-mask="solverMask"
    :data-number="cell.number"
    :data-selected=cell.selected
    :data-across-separator="showAcrossSeparator ? cell.acrossSeparator : undefined"
    :data-down-separator="showDownSeparator ? cell.downSeparator : undefined"
    :data-empty="cell.empty"
    :style="{backgroundColor: cell.shadingColor}"
    @click.prevent="onClick($event)"
    ref="tableCell"
    >
    <div v-if="!cell.empty && (
                 (cell.clues.across && cell == cell.clues.across.cells[0] && !cell.clues.across.hidden) || 
                 (cell.clues.down && cell == cell.clues.down.cells[0] && !cell.clues.down.hidden)
               )"
        class="cell-tooltip" ref="tooltip"><span v-html="tooltipHtml"></span><div class="cell-tooltip-arrow" data-popper-arrow></div></div>
    <template v-if="editable && !cell.empty">
        <input autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
            ref="input"
            class="crossword-grid-input"
            :value="cell.contents"
            :data-is-pencil="cell.special == '?'"
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
    font-size: 18px;
    text-transform: none;
    z-index: 95;
    background: #333;
    color: #fff;
    border-radius: 4px;
    font-family: $clueFontFamily;
    display: none;
    text-align: left;
    white-space: pre;
    pointer-events: none;

    &[data-show] {
        display: block !important;
        @media print {
            display: none !important;
        }
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
  left: -4px !important;
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

    ::selection {
        background-color: transparent;
    }

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

    &:not([data-empty]) {
        cursor: pointer;
        background: $gridBlankColor;
    }

    .crossword-grid-input {
        cursor: pointer;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        -webkit-touch-callout: none;
        -webkit-user-select: none; /* Disable selection/copy in UIWebView */
        font-family: $answerFontFamily;
        border: 0;
        border-radius: 0;
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

        &[data-is-pencil] {
            font-size: 1.55rem;
            padding-top: 2px;
            font-family: 'F*ck Beans';
            color: #565656;
        }
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
    isEndRow: Boolean,
    isEndCol: Boolean,
    editable: {
        type: Boolean,
        default: true
    }
  },
  watch: {
    cell(val) {
        this.refreshPopper();
    },
    downSelected(val) {
        this.refreshPopper();
    },
    acrossSelected(val) {
        this.refreshPopper();
    }
  },
  computed: {
    showAcrossSeparator() {
        if (!this.cell || !this.cell.clues || !this.cell.clues.across)
            return false;
        const clueCells = this.cell.clues.across.cells;
        return (this.cell.offsets.across != clueCells.length - 1);
    },
    showDownSeparator() {
        if (!this.cell || !this.cell.clues || !this.cell.clues.down)
            return false;
        const clueCells = this.cell.clues.down.cells;
        return (this.cell.offsets.down != clueCells.length - 1);
    },
    downSelected() {
        return this.cell && this.cell.clues && this.cell.clues.down && this.cell.clues.down.selected;
    },
    acrossSelected() {
        return this.cell && this.cell.clues && this.cell.clues.across && this.cell.clues.across.selected;
    },
    solverMask() {
        let v = (this.cell.acrossMask | this.cell.downMask);
        // can only show 4 overlapping solvers...
        while (nBitsSet(v) > 4) {
            v &= v - 1; // clear the least significant bit set
        }
        return v;
    },
    tooltipHtml() {
        var text = '';
        if (!this.cell.clues)
            return text;
        const acrossClue = this.cell.clues.across;
        const downClue = this.cell.clues.down;
        var clue;
        if (acrossClue) {
            clue = acrossClue;
        }
        if (downClue && (!acrossClue || downClue.selected)) {
            clue = downClue;
        }
        if (clue.hidden)
            return '';

        text = clue.sanitizedText + clue.lengthText;
        if (clue.showCorrect) {
            text += ' ✅'
        }
        if (clue.showIncorrect) {
            text += ' ❌'
        }

        var wrappedText = '';
        var lastWrap = 0;
        const words = text.split(' ');
        var n = 0;
        for (var i = 0; i < words.length; i++) {
            if ((n + words[i].length - lastWrap) > this.clueWrapChars) {
                wrappedText += '\n';
                lastWrap = n;
            } else {
                if (i > 0)
                    wrappedText += ' ';
            }
            wrappedText += words[i];
            n += words[i].length;
        }
        return wrappedText;
    }
  },
  methods: {
    refreshPopper() {
        if (!this.$refs.tooltip || !this.$refs.input)
            return;

        if (this.popper)
            this.popper.destroy();

        Vue.nextTick(() => {
            const fallbacks = this.downSelected ? ['left', 'right'] : ['bottom'];
            this.popper = createPopper(this.$refs.input, this.$refs.tooltip, {
              placement: 'top',
              modifiers: [
                {
                  name: 'flip',
                  options: {
                    fallbackPlacements: fallbacks,
                  },
                },
                {
                  name: 'offset',
                  options: {
                    offset: [0, 6],
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
        if (!this.tooltipHtml)
            return;

        if (this.$refs.tooltip)
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
        
        if (this.$refs.input && document.activeElement !== this.$refs.input) {
            if (this.cell.contents) {
                this.$refs.input.select();
            } else {
                this.$refs.input.focus();
            }
        }
    },
  },
  mounted() {
    this.refreshPopper();
  },
  data() {
    return {
      bundler: "Parcel",
      popper: null,
      clueWrapChars: 30
    };
  },
});
</script>