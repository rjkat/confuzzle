<template>
    <div class="clue-directions">
        <span class="clue-id">{{idText}} </span>
        <span class="clue-text" v-html="sanitizedText"></span>
        <span class="clue-length">{{lengthText}}</span>
        <div class="crossword-answer-container" v-if="value">
            <div class="crossword-clue-input">
                <input v-for="(cell, i) in value.cells"
                       maxlength="1"
                       :data-clueid="value.id"
                       :data-offset="i"
                       @click.prevent="selectClueFromInput($event)"
                       @keypress.prevent="handleKeypress($event)"
                       @keydown="handleKeydown($event)"
                       @mousedown.prevent
                       @blur="$emit('clear-own-highlight', value.id)"
                       :style="{backgroundColor: shadingColor(i)}"
                       v-model="value.cells[i].contents">
                </input>
            </div>
        </div>
    </div>
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
    cwDisplay: Object,
    value: Object,
  },
  computed: {
    idText: function () {
        const clue = this.value;
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
        this.value ? this.value.totalLength : 0;
    },
    lengthText: function () {
        const clue = this.value;
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
        if (!this.value) {
            return '';
        }
        return sanitizeHtml(this.value.text, {
            allowedTags: [ 
                'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'ul', 'ol', 'nl',
                'li', 'b', 'i', 'strong', 'em', 'strike', 'abbr', 'code'
            ]
        });
    }
  },
  methods: {
    shadingColor: function(i) {
        if (this.value)
            return this.value.shadingColor;
        if (this.value.cells[i])
            return this.value.cells[i].shadingColor;
        return '';
    },
    moveInput: function(input, direction) {
        const el = input.parentNode;
        const nextoffset = parseInt(input.dataset.offset, 10) + direction;
        const nextinput = el.querySelector(
            'input[data-offset="' + nextoffset + '"]'
        );
        if (nextinput) {
            nextinput.select();
            nextinput.focus();
        } else if (nextoffset >= 0) {
            // only blur when going off the end
            input.blur();
        }
    },
    fillCell: function(input, value) {
        input.value = value;
        this.$emit('fill-cell', {clueid: input.dataset.clueid, offset: input.dataset.offset, value: value});
        this.$emit('clear-own-highlight', input.dataset.clueid);
    },
    selectClueFromInput: function (event) {
        const input = event.target;
        this.$emit('select-clue', input.dataset.clueid);
        input.focus();
        input.select();
    },
    handleKeypress: function(event) {
        const input = event.target;
        this.fillCell(input, event.key);
        this.moveInput(input, 1);
    },
    handleKeydown: function (event) {
        const input = event.target;
        switch (event.keyCode) {
            case KeyCode.KEY_SPACE:
            case KeyCode.KEY_RIGHT:
            case KeyCode.KEY_DOWN:
                this.moveInput(input, 1);
                event.preventDefault();
                break;
            case KeyCode.KEY_BACK_SPACE:
                this.fillCell(input, '');
            case KeyCode.KEY_LEFT:
            case KeyCode.KEY_UP:
                this.moveInput(input, -1);
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
