<template>
    <li class="clue-directions">
        <span class="clue-id">{{idText}} </span>
        <span class="clue-text" v-html="sanitizedText"></span>
        <span class="clue-length">{{lengthText}}</span>
        <div class="crossword-answer-container" v-if="clue">
            <div class="crossword-clue-input">
                <input v-for="(cell, i) in clue.cells"
                       ref="inputs"
                       maxlength="1"
                       @click.prevent="selectClueFromInput($event, i)"
                       @keypress.prevent="handleKeypress($event, i)"
                       @keydown="handleKeydown($event, i)"
                       @mousedown.prevent
                       @blur="$emit('clear-own-highlight', clue.id)"
                       :style="{backgroundColor: shadingColor(i)}"
                       v-model="clue.cells[i].contents">
                </input>
            </div>
        </div>
    </li>
</template>

<style lang="scss">
.clue-directions {
    .crossword-clue-input {
        display: inline-block;
    }

    input {
        font-size: $gridFontSize;
        font-family: $answerFontFamily;
        padding: $gridBorderWidth 0 0 $gridBorderWidth;
        border: 0;
        padding-bottom: 1px;
        border-bottom: 1px solid $gridBgColor;
        margin-right: 2px;
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

    [data-separator=","]:after {
        font-family: $answerFontFamily;
        content: "\00A0";
    }

    [data-separator="-"]:after {
        font-family: $answerFontFamily;
        content: "-";
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
  },
  model: {
    prop: 'clue'
  },
  computed: {
    idText: function () {
        const clue = this.clue;
        if (!clue)
            return '';
        let idText = clue.numbering.clueText;
        if (!clue.verbatim && (clue.refIds && clue.id == clue.refIds[0]))
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
        return sanitizeHtml(this.clue.text, {
            allowedTags: [ 
                'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'ul', 'ol', 'nl',
                'li', 'b', 'i', 'strong', 'em', 'strike', 'abbr', 'code'
            ]
        });
    }
  },
  methods: {
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
            nextinput.select();
            nextinput.focus();
        } else if (pos >= 0) {
            // only blur when going off the end
            input.blur();
        }
    },
    fillCell: function(offset, value) {
        const cell = this.clue.cells[offset];
        cell.contents = value;
        this.$emit('fill-cell', {row: cell.row, col: cell.col, value: value});
        this.$emit('clear-own-highlight', this.clue.id);
    },
    selectClueFromInput: function (event, clueid) {
        const input = event.target;
        this.$emit('select-clue', clueid);
        input.focus();
        input.select();
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
      bundler: "Parcel"
    };
  }
});
</script>
