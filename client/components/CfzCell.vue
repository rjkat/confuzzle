<template>
<td :data-multi-solver-mask="solverMask(this.cell)"
    :data-number="cell.number ? cell.number : undefined"
    :data-selected=cell.selected
    :data-across-separator="showAcrossSeparator ? cell.acrossSeparator : undefined"
    :data-down-separator="showDownSeparator ? cell.downSeparator : undefined"
    :data-empty="cell.empty"
    :data-clue-mark="cell.clues && ((cell.clues.down && cell.id == cell.clues.down.cellIds[0] && !!cell.clues.down.mark) || (cell.clues.across && cell.id == cell.clues.across.cellIds[0] && !!cell.clues.across.mark))"
    :data-mark="cell.mark"
    :data-rebus="cell.rebus"
    :data-cell-shading-color="cell.shadingColor"
    @click.prevent="onClick($event)"
    ref="tableCell"
    >
    <div v-if="!cell.empty && (
                 (cell.clues.across && cell.id == cell.clues.across.cellIds[0] && !cell.clues.across.hidden) || 
                 (cell.clues.down && cell.id == cell.clues.down.cellIds[0] && !cell.clues.down.hidden)
               )"
        class="cell-tooltip" ref="tooltip"><span v-html="tooltipHtml"></span><div class="cell-tooltip-arrow" data-popper-arrow></div></div>
    <template v-if="editable && !cell.empty">
        <input autocomplete="off" autocorrect="off" autocapitalize="off" :spellcheck="false"
            ref="input"
            class="crossword-grid-input"
            @focus="event => event.target.value = ''"
            @blur="event => { event.target.value = cell.contents; event.target.placeholder = ''; }"
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
    <div class="cell-highlight-border" :data-cell-highlight-mask="cell.highlightMask" :data-cell-shading-color="cell.shadingColor"></div>
</td>
</template>

<style lang="scss">
@import '../stylesheets/themes';

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
  left: -4px !important;
}

.cell-tooltip[data-popper-placement^='left'] > .cell-tooltip-arrow {
  right: -4px;
  top: -4px !important;
}

.cell-tooltip[data-popper-placement^='right'] > .cell-tooltip-arrow {
  left: -4px;
  top: -4px !important;
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

    &[data-cell-highlight-mask] {
        border-color: attr(data-shading-color);
        border-width: '0.15ch';
    }
}

td {
    font-size: $gridFontSize;
    box-sizing: border-box;
    font-family: $answerFontFamily;
    
    min-width: $gridCellSize;
    max-width: $gridCellSize;
    min-height: $gridCellSize;
    height: $gridCellSize;
    max-height: $gridCellSize;
    position: relative;
    text-align: center;
    vertical-align: baseline;
    border: $gridBorderWidth solid var(--grid-bg-color);
    border-collapse: collapse; 
    background-color: attr(data-cell-shading-color);

    &[data-mark="circle"]:after {
      content: '';
      position: absolute;
      top: 10%;
      left: 7.5%;
      height: 85%;
      width: 85%;
      background-color: transparent;
      border-radius:50%;
      border: 1px solid var(--grid-bg-color);
    }

    ::selection {
        background-color: transparent;
    }

    &[data-number]:before {
        position: absolute;
        top: 0;
        left: 0;
        content: attr(data-number);
        font-size: .45em;
        line-height: 1em;
        padding: 1px;

        background-color: var(--number-bg-color) !important;
        color: var(--clue-text-color);

        @media print {
            background-color: transparent !important;
        }
        z-index: 5;
    }

    

    &[data-flat-number]:before {
        position: absolute;
        top: 0;
        left: 0;
        content: attr(data-flat-number);
        font-size: .45em;
        line-height: 1em;
        padding: 1px;

        background-color: var(--number-bg-color) !important;
        color: var(--clue-text-color);

        @media print {
            background-color: transparent !important;
        }
    }


    &[data-across-separator]:before {
        content: '';
        height: 100%;
        position: absolute;
        right: 0;
        top: 0;
        border-right: 3px var(--grid-bg-color) solid;
        z-index: 5;
    }

    &[data-down-separator]:before {
        content: '';
        width: 100%;
        position: absolute;
        right: 0;
        bottom: 0;
        border-bottom: 3px var(--grid-bg-color) solid;
        z-index: 5;
    }

    &[data-clue-mark]:after {
        position: absolute;
        top: 0;
        right: 0;
        text-align: right;
        content: '⭐';
        font-size: .35em;
        line-height: 1em;
        padding: 1px;

        @media print {
            display: none !important;
        }
        z-index: 4;
    }

    &:not([data-empty]) {
        cursor: pointer;
        &:not([data-multi-solver-mask]), &[data-multi-solver-mask="0"] {
            background: var(--grid-blank-color);
        }
        @media print {
            background: var(--grid-blank-color);
        }
    }


    .crossword-grid-input {
        cursor: pointer;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        color: var(--text-color);

        -webkit-user-select: none; /* Disable selection/copy in UIWebView */
        pointer-events: none;
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
            font-family: $pencilFontFamily;
            color: var(--pencil-text-color) !important;
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
    selectedClue: Object,
    isEndRow: Boolean,
    isEndCol: Boolean,
    editable: {
        type: Boolean,
        default: true
    }
  },
  watch: {
    cellContents(val) {
        this.$refs.input.value = val;
    },
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
    cellContents() {
        return this.cell.contents;
    },
    showAcrossSeparator() {
        if (!this.cell || !this.cell.clues || !this.cell.clues.across)
            return false;
        const clueCells = this.cell.clues.across.cellIds;
        return (this.cell.offsets.across != clueCells.length - 1);
    },
    showDownSeparator() {
        if (!this.cell || !this.cell.clues || !this.cell.clues.down)
            return false;
        const clueCells = this.cell.clues.down.cellIds;
        return (this.cell.offsets.down != clueCells.length - 1);
    },
    downSelected() {
        return this.cell && this.cell.clues && this.cell.clues.down && this.selectedClue && (this.cell.clues.down.id == this.selectedClue.id)
    },
    acrossSelected() {
        return this.cell && this.cell.clues && this.cell.clues.across && this.selectedClue && (this.cell.clues.across.id == this.selectedClue.id);
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
        if (downClue && (!acrossClue || this.downSelected)) {
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
                wrappedText += '<br>';
                lastWrap = n;
            } else {
                if (i > 0)
                    wrappedText += ' ';
            }
            wrappedText += words[i];
            n += words[i].length + 1;
        }
        return wrappedText;
    }
  },
  methods: {
    solverMask(cell) {
        let v = (cell.acrossMask | cell.downMask);
        // can only show 4 overlapping solvers...
        while (nBitsSet(v) > 4) {
            v &= v - 1; // clear the least significant bit set
        }
        return v;
    },
    refreshPopper() {
        if (!this.$refs.tooltip || !this.$refs.input)
            return;

        if (this.popper)
            this.popper.destroy();

        Vue.nextTick(() => {
            let fallbacks = this.downSelected ? ['left', 'right', 'bottom'] : ['top', 'bottom'];
            if (!this.$refs.input || !this.$refs.tooltip)
                return;
            this.popper = createPopper(this.$refs.input, this.$refs.tooltip, {
              placement: this.downSelected ? 'top' : 'left',
              modifiers: [
                {
                  name: 'flip',
                  options: {
                    fallbackPlacements: fallbacks
                  }
                },
                {
                  name: 'offset',
                  options: {
                    offset: [0, 6]
                  },
                },
                {
                  name: 'preventOverflow',
                  options: {
                    boundary: this.$refs.tableCell.parentElement,
                    rootBoundary: 'document'
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
        Vue.nextTick(() => {
            if (!this.editable)
                return;
            
            if (this.cell.contents) {
                this.$refs.input.placeholder = this.cell.contents;
                this.$refs.input.value = '';
            }
            this.$refs.input.focus();
        });
    },
  },
  mounted() {
    this.refreshPopper();
    if (this.$refs.input) {
        this.$refs.input.value = this.cell.contents;
    }
  },
  data() {
    return {
      bundler: "Parcel",
      popper: null,
      clueWrapChars: 20
    };
  },
});
</script>