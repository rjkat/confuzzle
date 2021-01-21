<template>
<div>
  <div class="cfz-scratchpad-container" ref="container">
    <div class="decrypt-container-label">
      <span class="clue-id">{{clue.idText}}{{clue.isAcross ? 'A' : 'D'}}</span>
      {{clue.sanitizedText}}<span class="clue-length">{{clue.lengthText}}</span>
    </div>
    <div class="word-container" ref="words">
      <template v-for="(word, i) in words">
        <ui-button raised class="word-tile" @click="explodeWord(word)"><span class="word-tile-text">{{word}}</span><span class="word-tile-length">{{word.length}}</span></ui-button>
      </template>
    </div>
    <div class="letter-widget" >
      <div class="letter-container" ref="letterContainer">
          <div v-for="(slot, index) in clueWorkingSlots[clue.id]" :key="index" class="working-slot letter-dropzone" :data-solver-mask="solverMask" :data-slot-offset="index">
              <div :class="slot ? 'letter-tile' : 'dummy-tile'" draggable data-from-answer="" :data-letter="slot" :data-slot-offset="index" :data-solver-mask="solverMask">{{slot}}</div>
          </div>
          <div class="letter-length-indicator" ref="lengthIndicator">{{numWorkingLetters}}</div>
      </div>
    </div>
    <div class="answer-widget" ref="answer">
      <div class="answer-cells">
          <div v-for="(slot, index) in clueAnswerSlots[clue.id]" :key="index" class="answer-slot" :data-slot-offset="index" :data-letter="slot" :data-solver-mask="solverMask" :style="separator(clue.cells[index]) ? {'margin-right': 'calc(1ch + 6px)'} : {}" :data-separator="separator(clue.cells[index])">
            <div class="answer-slot-contents letter-dropzone" :data-slot-offset="index" :data-letter="slot" :data-cell-contents="clue.cells[index].contents">
                 <div :class="slot ? 'letter-tile' : 'dummy-tile'" draggable data-from-answer="true" :data-solver-mask="solverMask" :data-letter="slot" :data-slot-offset="index">{{slot}}</div>
            </div>
          </div>
      </div>
    </div>
    <div class="decrypt-button-container">
      <ui-button raised color="red" class="decrypt-button" :disabled="!numWorkingLetters" icon="delete" @click="clearClicked()">Clear</ui-button>
      <ui-button raised class="decrypt-button" icon="shuffle" :disabled="!numWorkingLetters" @click="shuffleClicked()">Shuffle</ui-button>
      <ui-button raised color="primary" class="decrypt-button" :disabled="submitDisabled" icon="exit_to_app" @click="submitClicked()">Submit</ui-button>
    </div>
  </div>
</div>
</template>


<style lang="scss">
@import '../stylesheets/solvers';
    /*.draggable-source--is-dragging {
      visibility: hidden;
    }
    .draggable--original {
      visibility: hidden;
    }*/
    .cfz-scratchpad-container {
        overflow: auto;
        display: flex;
        min-height: 100%;
        max-height: 100%;
        flex-direction: column;
        font-family: $answerFontFamily;
        font-size: 26px;
        text-transform: uppercase;
        -webkit-user-select: none;
        padding: $displayPadding;
        .cfz-scratchpad-header {
            font-family: $clueFontFamily;
            text-transform: none;
            font-weight: bold;
            padding: .5em;
        }
        border: 1px solid #000;
        background: #fff;

        ul {
          list-style-type: none;
        }
    }
    .decrypt-button-container {
      display: flex;
      width: 100%;
      text-align: center;
    }
    .decrypt-button {
      margin: 8px;
    }
    .word-tile {
      margin-right: 8px;
      margin-top: 8px;
      min-width: 0 !important;
      padding: 4px !important;
      height: 20px;
    }

    .word-tile-length {
      margin-left: 4px;
      color: #888;
      font-family: $answerFontFamily;
      font-size: 12px;
    }
    
    .word-tile-text {
      font-family: $answerFontFamily !important;
    }
    .letter-dropzone {
      background: transparent;
      margin-right: 4px;
      margin-bottom: 4px;
      min-width: $gridCellSize;
      max-width: $gridCellSize;
      height: $gridCellSize;
    }
    .working-slot {
      border: 1px dashed #ddd;
    }
    .dummy-tile {
      visibility: hidden;
    }
    .letter-tile {
      border: $gridBorderWidth solid #000;
      box-sizing: border-box;
      cursor: grab;
      margin-right: 4px;
      margin-bottom: 4px;
      outline: none;
      box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
      min-width: $gridCellSize;
      max-width: $gridCellSize;
      height: $gridCellSize;
      line-height: $gridCellSize;
      text-align: center;
      vertical-align: middle;
      /*-webkit-user-select: none; */
    }
    @include each-solver using ($color, $lightColor, $sel) {
        .letter-tile#{$sel} {
            background-color: $color;
        }
        .answer-slot#{$sel} {
          border-color: $color;
        }
        .answer-slot#{$sel}:after {
          color: $color;
        }
    }
    .decrypt-container-label {
      font-family: $clueFontFamily;
      font-size: 14px;
      text-transform: none;
      width: 100%;
    }
    .word-container {
      flex: none;
      display: flex;
      flex-wrap: wrap;
      padding-top: 4px;
      padding-bottom: 8px;
    }
    .letter-widget {
      flex: 1;
      position: relative;
      border: 1px dashed #ddd;
      border-radius: 8px;
      margin-bottom: 8px;
      font-size: 26px;
      .letter-length-indicator {
          position: absolute;
          bottom: 4px;
          right: 4px;
          color: #888;
          font-family: $answerFontFamily;
          font-size: 16px;
      }
    }
    .letter-container {
      width: 100%;
      height: 100%;
      min-height: calc(#{$gridCellSize} + 20px);
      display: flex;
      flex-basis: auto;
      flex-wrap: wrap;
      align-content: flex-start;
      padding-top: 8px;
      padding-left: 16px;
      padding-right: 8px;
      padding-bottom: 8px;
    }
    .answer-widget {
      margin-top: auto;
      font-size: 26px;
      width: 100%;
    }
    .answer-cells {
      display: flex;
      flex-wrap: wrap;
      min-height: $gridCellSize;
    }
    .answer-slot {
      position: relative;
      border: $gridBorderWidth dashed;
      box-sizing: content-box;
      margin-right: 4px;
      margin-bottom: 4px;
      background: none;
      outline: none;
      min-width: $gridCellSize;
      max-width: $gridCellSize;
      height: $gridCellSize;
      z-index: 1;
      &[data-separator]:after {
        position: absolute;
        left: 0;
        top: 0;
        padding-left: 4px;
        margin-left: $gridCellSize;
        height: $gridCellSize;
        line-height: $gridCellSize;
        vertical-align: middle;
        content: attr(data-separator);
      }
    }
    .answer-slot-contents {
      width: 100%;
      position: absolute;
      &:before {
        top: 0;
        left: 0;
        width: 100%;
        text-align: center;
        content: attr(data-cell-contents);
        color: #888;
        position: absolute;
        z-index: -1;
      }
    }
    .crossword-separator {
      font-family: $answerFontFamily;
      margin-right: 4px;
    }
</style>

<script>
import Vue from "vue";
import CfzClue from './CfzClue.vue'

export default Vue.extend({
  components: {
  },
  props: {
    clue: Object,
    solverid: {
        type: Number,
        default: 0
    }
  },
  model: {
    prop: 'clue'
  },
  watch: {
    clue(newClue, oldClue) {
      if (!this.clueAnswerSlots[newClue.id])
        this.createAnswerSlots();
    }
  },
  computed: {
    words() {
      const words = this.clue.sanitizedText.split(/[ -]/g);
      const plainWords = [];
      for (const w of words) {
        // https://stackoverflow.com/a/31779560
        let plain = w.replace(/[~`!@#$%^&*(){}\[\];:"'<,.>?\/\\|_+=-]/g,'');
        plain = plain.replace(/[0-9]/g, '');
        if (plain) {
           plainWords.push(plain);
        }
      }
      return plainWords;
    },
    solverMask: function () {
        return (1 << (this.solverid % 8));
    },
    numWorkingLetters() {
      if (!this.clue || !this.clueWorkingSlots[this.clue.id]) {
        return 0;
      }
      let n = 0;
      for (const slot of this.clueWorkingSlots[this.clue.id]) {
        if (slot != '')
          n++;
      }
      return n;
    },
    submitDisabled() {
      if (!this.clue || !this.clueAnswerSlots[this.clue.id]) {
        return true;
      }
      for (const slot of this.clueAnswerSlots[this.clue.id]) {
        if (slot)
          return false;
      }
      return true;
    },
  },
  methods: {
    createAnswerSlots() {
      this.$set(this.clueAnswerSlots, this.clue.id, []);
      this.clueAnswerSlots[this.clue.id].splice(this.clue.cells.length);
      for (let i = 0; i < this.clue.cells.length; i++) {
        this.$set(this.clueAnswerSlots[this.clue.id], i, '');
      }
    },
    clearClicked() {
      this.$set(this.clueWorkingSlots, this.clue.id, []);
      for (let i = 0; i < this.clueAnswerSlots[this.clue.id].length; i++) {
        this.$set(this.clueAnswerSlots[this.clue.id], i, '');
      }
    },
    moveLettersToStart() {
      // move everything back to the start
      const a = this.clueWorkingSlots[this.clue.id];
      let i = 0;
      for (let i = 0; i < a.length; i++) {
        if (!a[i]) {
          for (let j = i + 1; j < a.length; j++) {
            if (a[j]) {
              this.$set(a, i, a[j]);
              this.$set(a, j, '');
              break;
            }
          }
        }
      }
    },
    // https://stackoverflow.com/a/6274381
    shuffleClicked() {
      const a = this.clueWorkingSlots[this.clue.id];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = a[i];
        this.$set(a, i, a[j]);
        this.$set(a, j, tmp);
      }
      this.moveLettersToStart();
    },
    submitClicked() {
      const text = [];
      for (const letter of this.clueAnswerSlots[this.clue.id]) {
        text.push(letter);
      }
      this.$emit('submit-decrypt', {
        text: text,
        clue: this.clue
      });
      this.clearClicked();
    },
    dropTile(fromAnswer, srcOffset, letter, target) {
      if (!target.classList.contains('letter-dropzone')) {
        return;
      }
      const toAnswer = target.classList.contains('answer-slot') || target.classList.contains('answer-slot-contents');
      const dstOffset = parseInt(target.dataset.slotOffset);

      const srcSlots = fromAnswer ? this.clueAnswerSlots[this.clue.id] : this.clueWorkingSlots[this.clue.id];
      const dstSlots = toAnswer ? this.clueAnswerSlots[this.clue.id] : this.clueWorkingSlots[this.clue.id];
      
      this.$set(srcSlots, srcOffset, '');
      this.$set(dstSlots, dstOffset, letter);
    },
    explodeWord(word) {
      if (!this.clueWorkingSlots[this.clue.id]) {
        this.$set(this.clueWorkingSlots, this.clue.id, []);
      }
      this.clueWorkingSlots[this.clue.id].splice(this.clueWorkingSlots[this.clue.id].length + word.length);

      // find first free slot from the end
      let i = this.clueWorkingSlots[this.clue.id].length;
      while (i >= 0 && !this.clueWorkingSlots[this.clue.id][i]) {
        i--;
      }
      i++;
      for (const c of word) {
        this.$set(this.clueWorkingSlots[this.clue.id], i, c);
        i++;
      }
    },
    separator: function (cell) {
        if (!cell)
          return '';
        let sep = this.clue.isAcross ? cell.sanitizedAcrossSeparator : cell.sanitizedDownSeparator;
        if (!sep) {
            return null;
        }
        if (sep == ',') {
            sep = " ";
        }
        return sep;
    }
  },
  data() {
    return {
      clueWorkingSlots: {},
      clueAnswerSlots: {}
    };
  },
  mounted() {
    this.createAnswerSlots();
  }
});
</script>