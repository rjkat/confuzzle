<template>
    <div class="clue-directions">
        <span class="clue-id">{{idText}} </span>
        <span class="clue-text">{{sanitizedText}}</span>
        <span class="clue-length">{{lengthText}}</span>
        <div class="crossword-answer-container">
            <div class="crossword-clue-input">
                <input v-for="i in clue.totalLength"
                       maxlength="1"
                       :data-clueid="clue.id"
                       :data-offset="i"
                       @click.prevent="selectClueFromInput($event)"
                       @keypress.prevent="handleKeypress($event)"
                       @keydown="handleKeydown($event)"
                       @mousedown.prevent
                       @blur="$emit('clear-own-highlight', clue.id)"
                       :style="{backgroundColor: shadingColor(i)}">
                </input>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from "vue";
import * as KeyCode from 'keycode-js';

const sanitizeHtml = require('sanitize-html');

export default Vue.extend({
  props: {
    cwDisplay: Object,
    clue: Object,
  },
  computed: {
    idText: function () {
        const clue = this.clue;
        let idText = clue.numbering.clueText;
        if (!clue.verbatim && (clue.refIds && this.clue.id == clue.refIds[0]))
        {
            idText = clue.refIds.join(', ');
        }
        return idText;
    },
    lengthText: function () {
        const clue = this.clue;
        // don't show lengths on referenced clues or verbatim clues
        if (clue.verbatim)
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
    totalLength: function () {
        return this.clue.lengths.reduce((acc, x) => acc + x);
    },
    sanitizedText: function () {
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
