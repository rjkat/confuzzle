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
          <drop-list row :items="workingLetters[clue.id]"
              @insert="insertWorkingTile"
              @reorder="reorderWorkingTiles"
              mode="cut">
              <template v-slot:item="{item}">
                <drag class="letter-tile" :data="item" :data-solver-mask="solverMask" :key="item.offset" @cut="cutWorkingLetter(item.offset)">{{item.letter}}</drag>
              </template>
              <template v-slot:feedback="{ data }">
                <div class="letter-tile feedback" :key="data" :data-solver-mask="solverMask">{{ data }}</div>
              </template>
          </drop-list>
          <div class="letter-length-indicator" ref="lengthIndicator">{{numWorkingLetters}}</div>
      </div>
    </div>
    <div class="answer-widget" ref="answer">
      <div class="answer-cells">
          <drop mode="cut" v-for="(slot, index) in answerSlots[clue.id]" :key="index" class="answer-slot" :data-solver-mask="solverMask" :style="separator(clue.cells[index]) ? {'margin-right': 'calc(1ch + 6px)'} : {}" :data-separator="separator(clue.cells[index])"
          @drop="answerTileDropped($event, index)" :accepts-data="() => !slot.letter">
            <div class="answer-slot-contents" :data-cell-contents="clue.cells[index].contents">
                 <drag :class="slot.letter ? 'letter-tile' : 'dummy-tile'" :data-solver-mask="solverMask" :key="index" :data="slot.letter" @cut="cutAnswerLetter(index)">{{slot.letter}}</drag>
            </div>
          </drop>
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
    .drag-source {
      opacity: 0.4;
    }
    .answer-slot.drop-in {
      opacity: 0.4;
    }
    .drag-mode-cut {
      visibility: hidden;
    }
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
      display: inline-block;
      /*-webkit-user-select: none; */
    }
    .letter-tile.feedback {
      border: $gridBorderWidth dashed #000;
      opacity: 0.4;
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

        .drop-in#{$sel} {
          background-color: $color;
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
      position: relative;
      flex: 1;
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
      min-height: calc(#{$gridCellSize} + 20px);
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

import { Drag, Drop, DropList } from "vue-easy-dnd";


export default Vue.extend({
  components: {
    Drag,
    Drop,
    DropList
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
      if (!this.answerSlots[newClue.id])
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
      if (!this.clue || !this.workingLetters[this.clue.id])
        return 0;
      return this.workingLetters[this.clue.id].length;
    },
    submitDisabled() {
      if (!this.clue || !this.answerSlots[this.clue.id]) {
        return true;
      }
      for (const slot of this.answerSlots[this.clue.id]) {
        if (slot.letter)
          return false;
      }
      return true;
    },
  },
  methods: {
    createAnswerSlots() {
      this.$set(this.answerSlots, this.clue.id, []);
      this.answerSlots[this.clue.id].splice(this.clue.cells.length);
      for (let i = 0; i < this.clue.cells.length; i++) {
        this.$set(this.answerSlots[this.clue.id], i, {offset: i, letter: ''});
      }
    },
    clearClicked() {
      this.$set(this.workingLetters, this.clue.id, []);
      for (let i = 0; i < this.answerSlots[this.clue.id].length; i++) {
        this.$set(this.answerSlots[this.clue.id], i, {offset: i, letter: ''});
      }
    },
    // https://stackoverflow.com/a/6274381
    shuffleClicked() {
      const a = this.workingLetters[this.clue.id];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = a[i];
        this.$set(a, i, {letter: a[j].letter, offset: i});
        this.$set(a, j, {letter: tmp.letter, offset: j});
      }
    },
    submitClicked() {
      const text = [];
      for (const slot of this.answerSlots[this.clue.id]) {
        text.push(slot.letter);
      }
      this.$emit('submit-decrypt', {
        text: text,
        clue: this.clue
      });
      this.clearClicked();
    },
    explodeWord(word) {
      if (!this.workingLetters[this.clue.id]) {
        this.$set(this.workingLetters, this.clue.id, []);
      }
      this.workingLetters[this.clue.id].splice(this.workingLetters[this.clue.id].length + word.length);
      let i = this.workingLetters[this.clue.id].length;
      for (const c of word) {
        this.$set(this.workingLetters[this.clue.id], i, {
          offset: i,
          letter: c
        });
        i++;
      }
    },
    cutAnswerLetter(offset) {
      this.$set(this.answerSlots[this.clue.id], offset, {offset: offset, letter: ''});
    },
    cutWorkingLetter(offset) {
      this.workingLetters[this.clue.id].splice(offset, 1);
      for (let i = offset; i < this.workingLetters[this.clue.id].length; i++) {
        this.$set(this.workingLetters[this.clue.id][i], 'offset', i);
      }
    },
    insertWorkingTile(event) {
      for (let offset = this.workingLetters[this.clue.id].length - 1; offset >= event.index; offset--)
      {
        this.$set(this.workingLetters[this.clue.id][offset], 'offset', offset + 1);
      }

      this.workingLetters[this.clue.id].splice(event.index, 0, {
        letter: event.data,
        offset: event.index
      });
    },
    reorderWorkingTiles(event) {
      this.$set(this.workingLetters[this.clue.id][event.from], 'offset', event.to);
      this.$set(this.workingLetters[this.clue.id][event.to], 'offset', event.from);
      event.apply(this.workingLetters[this.clue.id]);
    },
    answerTileDropped(event, answerOffset) {
      const letter = event.data.letter || event.data;
      this.answerSlots[this.clue.id][answerOffset].letter = letter;
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
      workingLetters: {},
      answerSlots: {}
    };
  },
  mounted() {
    this.createAnswerSlots();
  }
});
</script>