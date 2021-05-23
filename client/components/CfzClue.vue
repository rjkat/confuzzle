<template>
    <li class=clue-item
        :class="{highlighted: selected || highlighted}"
        :data-solver-mask="solverMask"
        ref="item">
        <span class="clue-directions" @click="directionsClicked()">
            <span class="clue-id">{{clue.idText}}<span class="hidden-print" v-if="showDirection">{{clue.directionText}}</span></span>
            <span class="clue-text" v-html="clue.sanitizedText"></span>
            <span class="clue-length">{{clue.lengthText}}</span>
        </span>
        <div class="crossword-answer-container" v-if="clue" ref="answer">
            <div class="crossword-clue-input hidden-print" :style="{backgroundColor: clue.shadingColor}">
                <template v-for="(cell, i) in clue.cells">
                    <input ref="inputs"
                           autocomplete="off"
                           autocorrect="off"
                           autocapitalize="off"
                           spellcheck="false"
                           maxlength="1"
                           :data-cell-index="i"
                           @click.prevent="select($event.target)"
                           @blur="focusChanged()"
                           @focus="focusChanged()"
                           @keydown="handleKeydown($event, i)"
                           @input="handleInput($event, i)"
                           @mousedown.prevent
                           :style="{backgroundColor: shadingColor(i)}"
                           :data-solver-mask="solverMask"
                           :data-is-pencil="cell.special == '?'"
                           :class="{highlighted: selected || highlighted}"
                           v-model="clue.cells[i].contents">
                    </input><span v-if="separator(cell)" class="crossword-separator" v-html="separator(cell)"></span>
                </template>
                
                <ui-icon v-if="clue.showCorrect">check</ui-icon>
                <ui-icon v-if="clue.showIncorrect">close</ui-icon>
            </div>
        </div>
    </li>
</template>

<style lang="scss">
@import '../stylesheets/solvers';
@import '../stylesheets/themes';

.crossword-answer-container {
    cursor: default;
}

.clue-item {
   
    .clue-directions {
        cursor: pointer;
    }

    @media print {
        font-size: 13px;
    }

    .crossword-clue-input {
        display: inline-block;
        height: 29px;
        ::selection {
            background-color: transparent;
        }
    }

    input {
        cursor: pointer;
        font-size: 22px;
        font-family: $answerFontFamily;
        padding: $gridBorderWidth 0 0 $gridBorderWidth;
        border: 0;
        border-radius: 0;
        padding-bottom: 1px;

        @include theme-var(text-color) using ($value) {
           color: $value;
        }
        @include theme-var(clue-text-color) using ($value) {
           border-bottom: 1px solid $value;
        }
        background: none;
        outline: none;
        min-width: 29px;
        max-width: 29px;
        height: 100%;
        line-height: 100%;
        text-align: center;
        vertical-align: middle;
        text-transform: uppercase;
        box-sizing: border-box;
        -webkit-user-select: none; 

        &[data-is-pencil] {
            vertical-align: bottom !important;
            line-height: 10px;
            font-size: 1.55rem;
            padding-top: 4px;
            min-height: 29px;
            max-width: 29px;
            min-width: 29px;
            font-family: $pencilFontFamily;
            @include theme-var(pencil-text-color) using ($value) {
                color: $value;
            }
        }
    }

    

    input:focus {
        background-color: #0075eb !important;
        color: #fff;
    }


    @include each-solver using ($color, $lightColor, $sel) {
        input.highlighted#{$sel} {
            padding-bottom: 0px;
            border-bottom: 2px solid $color;
        }
    }

    .crossword-separator {
        font-family: $answerFontFamily;
        font-size: $gridFontSize;
        vertical-align: middle;
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

export default Vue.extend({
  props: {
    clue: Object,
    usingPencil: Boolean,
    solverid: {
        type: Number,
        default: 0
    }
  },
  model: {
    prop: 'clue'
  },
  watch: {
    selected: function(val) {
        if (val && !this.wasClicked) {
            this.scrollIntoView();     
        }
        this.wasClicked = false;
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
        return (1 << (this.solverid % 8));
    },
    isPrimaryRef: function () {
        const clue = this.clue;
        return (clue.refIds && clue.id == clue.refIds[0]);
    },
    showDirection: function () {
        const clue = this.clue;
        return (clue.numbering.clueText == clue.numbering.gridText) && !(this.isPrimaryRef);
    },
    totalLength() {
        this.clue ? this.clue.totalLength : 0;
    },
  },
  methods: {
    scrollIntoView() {
        Vue.nextTick(() => this.$refs.item.scrollIntoView({behavior: 'smooth', block: 'center'}));
    },
    separator: function (cell) {
        let sep = this.clue.isAcross ? cell.sanitizedAcrossSeparator : cell.sanitizedDownSeparator;
        if (!sep) {
            return null;
        }
        if (sep == ',') {
            sep = "&nbsp;";
        }
        return sep;
    },
    directionsClicked: function(forced) {
        for (let i = 0; i < this.$refs.inputs.length; i++) {
            if (this.$refs.inputs[i].dataset.cellIndex == 0) {
                this.$refs.inputs[i].click();
            }
        }
        if (forced) {
            this.clue.select(this.solverid);

            this.scrollIntoView();
        } else {
            this.wasClicked = true;
        }
    },
    focusChanged: function() {
        let haveFocus = false;
        for (let i = 0; i < this.$refs.inputs.length; i++) {
            haveFocus |= this.$refs.inputs[i] === document.activeElement
        }
        this.wasClicked |= haveFocus;
        if (haveFocus) {
            this.clue.select(this.solverid);
        }
    },
    shadingColor: function(i) {
        if (this.clue && this.clue.shadingColor)
            return this.clue.shadingColor;
        if (this.clue.cells[i])
            return this.clue.cells[i].shadingColor;
        return '';
    },
    moveInput: function(input, pos) {
        let nextinput = undefined;
        for (let i = 0; i < this.$refs.inputs.length; i++) {
            if (this.$refs.inputs[i].dataset.cellIndex == pos) {
                nextinput = this.$refs.inputs[i];
            }
        }
        if (nextinput) {
            this.select(nextinput);
        } else if (pos >= 0) {
            // only blur when going off the end
            input.blur();
            this.$emit('deselect-clue', this.clue);
        }
    },
    select: function(input) {
        this.wasClicked = true;
        if (input.value) {
            input.select();
        } else {
            input.focus();
        }
    },
    fillCell: function(offset, value) {
        this.clue.showCorrect = false;
        this.clue.showIncorrect = false;
        const special = (this.usingPencil && value && value != ' ') ? '?' : '-';
        this.clue.cells[offset].special = special;
        this.$emit('fill-cell', {clueid: this.clue.id, offset: offset, value: value, special: special});
    },
    handleInput(event, offset) {
        const input = event.target;
        this.fillCell(offset, input.value);
        if (input.value)
        {
          this.moveInput(input, offset + 1);
        }
    },
    handleKeydown: function (event, offset) {
        const input = event.target;
        switch (event.keyCode) {
            case KeyCode.KEY_SPACE:
                this.clue.cells[offset].contents = '';
                this.fillCell(offset, '');
            case KeyCode.KEY_RIGHT:
            case KeyCode.KEY_DOWN:
                this.moveInput(input, offset + 1);
                event.preventDefault();
                break;
            case KeyCode.KEY_BACK_SPACE:
                this.clue.cells[offset].contents = '';
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
  mounted () {
    if (this.selected)
        this.scrollIntoView()
  },
  data() {
    return {
        bundler: "Parcel",
        wasClicked: false
    };
  }
});
</script>
