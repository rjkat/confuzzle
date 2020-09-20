<template>
    <li class=clue-item
        :class="{highlighted: selected || highlighted}"
        :data-solver-mask="solverMask"
        ref="item">
        <span class="clue-directions" @click="directionsClicked()">
            <span class="clue-id">{{idText}}<span class="hidden-print" v-if="showDirection">{{clue.isAcross ? 'A' : 'D'}}</span> </span>
            <span class="clue-text" v-html="sanitizedText"></span>
            <span class="clue-length">{{lengthText}}</span>
        </span>
        <div class="crossword-answer-container" v-if="clue" ref="answer" v-responsive.class>
            <div class="crossword-clue-input hidden-print" :style="{backgroundColor: clue.shadingColor}" v-responsive.class>
                <template v-for="(cell, i) in clue.cells">
                    <input ref="inputs"
                           maxlength="1"
                           @click.prevent="select($event.target)"
                           @keypress.prevent="handleKeypress($event, i)"
                           @blur="focusChanged()"
                           @focus="focusChanged()"
                           @keydown="handleKeydown($event, i)"
                           :style="{backgroundColor: shadingColor(i)}"
                           :data-solver-mask="solverMask"
                           :class="{highlighted: selected || highlighted}"
                           v-model="clue.cells[i].contents">
                    </input><span v-if="separator(cell)" class="crossword-separator" v-html="separator(cell)"></span>
                </template>
            </div>
        </div>
    </li>
</template>

<style lang="scss">
@import '../stylesheets/solvers';

.clue-item {
    .clue-directions {
        cursor: pointer;
    }

    @media print {
        font-size: 13px;
    }

    .crossword-clue-input {
        display: inline-block;
    }

    input {
        font-size: $gridFontSize;
        font-family: $answerFontFamily;
        padding: $gridBorderWidth 0 0 $gridBorderWidth;
        border: 0;
        border-radius: 0;
        padding-bottom: 1px;
        border-bottom: 1px solid $gridBgColor;
        background: none;
        outline: none;
        min-width: $gridCellSize;
        max-width: $gridCellSize;
        height: $gridCellSize;
        line-height: $gridCellSize;
        text-align: center;
        vertical-align: middle;
        text-transform: uppercase;
        box-sizing: border-box;
    }


    @include each-solver using ($color, $lightColor, $sel) {
        input.highlighted#{$sel} {
            padding-bottom: 0px;
            border-bottom: 2px solid $color;
        }
    }

    .crossword-separator {
        font-family: $answerFontFamily;
        margin-right: 4px;
    }

    .clue-id {
        font-weight: bold;
    } 
}
</style>

<script>
import Vue from "vue";
import * as KeyCode from 'keycode-js';

const sanitizeHtml = require('sanitize-html');

export default Vue.extend({
  props: {
    clue: Object,
    solverid: {
        type: Number,
        default: 0
    },
  },
  model: {
    prop: 'clue'
  },
  watch: {
    selected: function(val) {
        if (val && !this.wasClicked) {
            this.$refs.item.scrollIntoView({behavior: 'smooth'});
        }
        if (!val) {
            this.wasClicked = false;
        }
    }
  },
  computed: {
    highlighted() {
        return this.clue.highlightMask & this.solverMask;
    },
    selected() {
        return this.clue.selected;
    },
    solverMask: function () {
        return (1 << this.solverid);
    },
    isPrimaryRef: function () {
        const clue = this.clue;
        return (clue.refIds && clue.id == clue.refIds[0]);
    },
    showDirection: function () {
        const clue = this.clue;
        return (clue.numbering.clueText == clue.numbering.gridText) && !(this.clue.verbatim || this.isPrimaryRef);
    },
    idText: function () {
        const clue = this.clue;
        if (!clue)
            return '';
        let idText = clue.numbering.clueText;
        if (!clue.verbatim && this.isPrimaryRef)
        {
            idText = clue.refIds.join(', ');
        }
        return idText;
    },
    totalLength() {
        this.clue ? this.clue.totalLength : 0;
    },
    lengthText: function () {
        const clue = this.clue;
        // don't show lengths on referenced clues or verbatim clues
        if (!clue || clue.verbatim)
            return '';
        if (clue.refIds.length > 0 && clue.id != clue.refIds[0])
            return '';
        let lengthText = ' (';
        let lengths = clue.refLengths ? clue.refLengths : clue.lengths;
        
        // handle case where one clue has been split across multiple grid cells
        if (clue.refLengths
            && clue.refSeparators
            && clue.refSeparators.length == 0) {
            lengths = [clue.refLengths.reduce((acc, x) => acc + x)];
        }
        const sep = clue.refSeparators ? clue.refSeparators : clue.separators;
        for (let i = 0; i < lengths.length; i++) {
            if (i > 0) {
                lengthText += sep[i - 1];
            }
            lengthText += lengths[i];
        }
        if (lengths.length - 1 < sep.length && !clue.refIds) {
            lengthText += sep[lengths.length - 1];
        }
        lengthText += ')';
        return lengthText;
    },
    sanitizedText: function () {
        if (!this.clue) {
            return '';
        }
        return sanitizeHtml(this.clue.text, this.htmlOptions);
    }
  },
  methods: {
    separator: function (cell) {
        let sep = this.clue.isAcross ? cell.acrossSeparator : cell.downSeparator;
        if (!sep) {
            return null;
        }
        if (sep == ',') {
            sep = "&nbsp;";
        }
        return sanitizeHtml(sep, this.htmlOptions);
    },
    directionsClicked: function() {
        const cls = this.$refs.answer.classList;
        const isMobile = cls.contains("bs4-xs") || cls.contains("bs4-sm");
        this.$refs.inputs[0].click();
        this.wasClicked = true;
    },
    focusChanged: function() {
        let haveFocus = false;
        for (let i = 0; i < this.$refs.inputs.length; i++) {
            haveFocus |= this.$refs.inputs[i] === document.activeElement
        }
        this.wasClicked |= haveFocus;
        haveFocus ? this.clue.select(this.solverid) : this.clue.deselect(this.solverid);
    },
    shadingColor: function(i) {
        if (this.clue)
            return this.clue.shadingColor;
        if (this.clue.cells[i])
            return this.clue.cells[i].shadingColor;
        return '';
    },
    moveInput: function(input, pos) {
        const nextinput = this.$refs.inputs[pos];
        if (nextinput) {
            this.select(nextinput);
        } else if (pos >= 0) {
            // only blur when going off the end
            input.blur();
        }
    },
    select: function(input) {
        this.wasClicked = true;
        input.focus();
        input.select();
    },
    fillCell: function(offset, value) {
        const cell = this.clue.cells[offset];
        cell.contents = value;
        this.$emit('fill-cell', {clueid: this.clue.id, offset: offset, value: value});
    },
    handleKeypress: function(event, offset) {
        this.fillCell(offset, event.key);
        this.moveInput(event.target, offset + 1);
    },
    handleKeydown: function (event, offset) {
        const input = event.target;
        switch (event.keyCode) {
            case KeyCode.KEY_SPACE:
            case KeyCode.KEY_RIGHT:
            case KeyCode.KEY_DOWN:
                this.moveInput(input, offset + 1);
                event.preventDefault();
                break;
            case KeyCode.KEY_BACK_SPACE:
                this.fillCell(offset, '');
                this.moveInput(input, offset - 1);
                event.preventDefault();
                break;
            case KeyCode.KEY_LEFT:
            case KeyCode.KEY_UP:
                this.moveInput(input, offset - 1);
                event.preventDefault();
                break;
            case KeyCode.KEY_ESCAPE:
            case KeyCode.KEY_RETURN:
                input.blur();
                event.preventDefault();
                break;
        }
    }
  },
  data() {
    return {
        bundler: "Parcel",
        wasClicked: false,
        htmlOptions: {
            allowedTags: [ 
                'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'ul', 'ol', 'nl',
                'li', 'b', 'i', 'strong', 'em', 'strike', 'abbr', 'code'
            ]
        }
    };
  }
});
</script>
