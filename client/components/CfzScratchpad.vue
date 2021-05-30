<template>
<div>
  <div class="cfz-scratchpad-container" ref="container">
    <template v-if="!standalone">
      <div v-if="clue.id != 'dummy'" class="decrypt-container-label">
        <span class="clue-id">{{clue.idText + clue.directionText}}</span>
        <span v-html="clue.sanitizedText"></span>
        <span class="clue-length">{{clue.lengthText}}</span>
      </div>
      <div v-else class="decrypt-container-label">Select a clue to solve.</div>
    </template>
    <template v-else>
      <div class="cfz-scratchpad-standalone-subtitle">Add letters and drag to arrange them below.</div>
    </template>
    <div class="word-container" ref="words">
      <template v-for="(word, i) in words">
        <ui-button raised disable-ripple class="word-tile" @click="explodeWord(word)"><span class="word-tile-text">{{word}}</span><span class="word-tile-length">{{word.length}}</span></ui-button>
      </template>
      <ui-button v-if="clue.id != 'dummy' && !standalone" color="primary" raised disable-ripple class="word-tile" @click="openCustomModal()"><span class="word-tile-text">custom...</span></ui-button>
    </div>
    <div class="letter-widget" :data-standalone="standalone">
      <div class="letter-container" ref="letterContainer" @touchmove="$event.preventDefault()">
          <drop-list v-if="clue" class="letter-list" row :items="workingLetters[clue.id]"
              @insert="insertWorkingTile"
              @reorder="reorderWorkingTiles"
              mode="cut">
              <template v-slot:item="{item}">
                <drag class="letter-tile" :data-is-pencil="usingPencil" :data="item" :data-solver-mask="solverMask" :key="item.id" @cut="cutWorkingLetter(item)" :data-standalone="standalone">{{item.letter}}</drag>
              </template>
              <template v-slot:feedback="{ data }">
                <div class="letter-tile letter-tile-feedback" :data-is-pencil="usingPencil" :key="data.id" :data-solver-mask="solverMask" :data-standalone="standalone">{{ data.letter }}</div>
              </template>
          </drop-list>
          <drop v-if="clue && numAnswerLetters > 0 && workingLetters[clue.id] && workingLetters[clue.id].length == 0" mode="cut" class="answer-slot" :data-solver-mask="solverMask"  
              @drop="insertFirstWorkingTile($event)">
          </drop>
          <div class="letter-length-indicator" ref="lengthIndicator" :data-solver-mask="solverMask">{{numWorkingLetters}}</div>
      </div>
    </div>
    <div class="answer-widget" ref="answer" @touchmove="$event.preventDefault()">
      <div v-if="clue && answerSlots[clue.id]" class="answer-cells">
          <drop mode="cut" v-for="(slot, index) in answerSlots[clue.id]" :key="index" class="answer-slot" :data-solver-mask="solverMask" :style="separator(answerCells[index]) ? {'margin-right': 'calc(1ch + 6px)'} : {}" :data-separator="separator(answerCells[index])"
          @drop="answerTileDropped($event, index)" :accepts-data="() => !slot.item">
            <div class="answer-slot-contents" :data-cell-contents="answerCells[index].contents" :data-is-pencil="answerCells[index].special == '?'">
                 <drag class="letter-tile" :data-is-pencil="usingPencil" :data-letter="slot.item ? slot.item.letter : ''" :data-solver-mask="solverMask" :key="index" :data="slot.item" @cut="cutAnswerLetter(index)">{{slot.item ? slot.item.letter : ''}}</drag>
            </div>
          </drop>
          <div class="letter-length-indicator" :data-solver-mask="solverMask"><div :style="{'text-align': 'left', 'padding-left': numAnswerLetters < 10 ? '0.5em' : 0}">{{numAnswerLetters}}</div><div :style="{'text-align': 'right', 'padding-right': answerSlots[clue.id].length < 10 ? '0.5em' : 0}">{{answerSlots[clue.id].length}}</div></div>
      </div>
    </div>
    <div class="decrypt-button-container">
      <ui-button raised color="red" class="decrypt-button" :disabled="!numWorkingLetters && !numAnswerLetters" icon="delete" @click="clearClicked()">Clear</ui-button>
      <ui-button raised class="decrypt-button" icon="shuffle" :disabled="!numWorkingLetters" @click="shuffleClicked()">Shuffle</ui-button>
      <ui-button v-if="standalone" raised color="primary" class="decrypt-button" icon="add" @click="openCustomModal()">Letters</ui-button>
      <ui-button v-else raised color="primary" class="decrypt-button" :disabled="submitDisabled" icon="exit_to_app" @click="submitClicked()">Submit</ui-button>
    </div>
  </div>
  <ui-modal ref="customWordModal" title="Add custom letters">
    <div style="text-align: center;">
        <ui-textbox ref="nameBox" class="crossword-join-input crossword-name-input" v-model="customWord" @keydown-enter="addCustomClicked()">
                Enter letters ({{plainCustomWord ? plainCustomWord.length : 0}})
        </ui-textbox> 
        <ui-button color="primary" @click="addCustomClicked()">Add</ui-button>
    </div>
  </ui-modal>
</div>
</template>


<style lang="scss">
@import '../stylesheets/themes';

@import '../stylesheets/solvers';
    
    .letter-length-indicator {
          display: flex;
          flex-direction: column;
          text-align: center;
          font-family: $answerFontFamily;
    }
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
        overflow-y: scroll;
        display: flex;
        height: 100%;
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
        background-color: var(--clue-bg-color);
        ul {
          list-style-type: none;
        }

        .cfz-scratchpad-standalone-title {
          width: 100%;
          text-align: center;
          font-family: $titleFontFamily;
        }
        .cfz-scratchpad-standalone-subtitle {
          width: 100%;
          padding-top: 1rem;
          text-transform: none;
          color: var(--clue-text-color);
          font-family: $clueFontFamily;
          text-align: center;
        }
    }
    .decrypt-button-container {
      display: flex;
      width: 100%;
      justify-content: center;
      text-align: center;
    }
    .decrypt-button {
      margin: 8px;
    }
    .word-tile {
      cursor: pointer !important;
      margin-right: 8px;
      margin-top: 8px;
      min-width: 0 !important;
      padding: 4px !important;
      height: 20px;
    }

    .word-tile-length {
      margin-left: 4px;
      color: var(--pencil-text-color);
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
      box-sizing: content-box;
      color: var(--text-color);

      cursor: grab;
      margin-right: 4px;
      margin-bottom: 4px;
      outline: none;
      box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
      width: 31px;
      height: 31px;

      &[data-standalone] {
        width: 41px;
        height: 41px;
        font-size: 36px;
        line-height: 41px;
      }

      vertical-align: middle;
      text-align: center;
      display: inline-block;
      /*-webkit-user-select: none; */

      &:not([data-standalone]):not([data-is-pencil]) {
        line-height: 31px;
      }

      &[data-is-pencil] {
        padding-top: 4px;
        height: 27px;

        font-family: $pencilFontFamily;
        color: var(--pencil-text-color);
      }

      &[data-letter=""] {
        visibility: hidden !important;
      }
    }
    .letter-tile-feedback {
      opacity: 0.4;
    }
    @include each-solver using ($color, $lightColor, $sel) {
        .theme-light, * {
          .letter-tile#{$sel} {
              background-color: $color;
          }
          
          .answer-slot#{$sel} {
            border-color: $color;
          }
          .answer-widget .letter-length-indicator#{$sel} {
            border-color: $color;
          }
          .answer-slot#{$sel}:after {
            color: $color;
          }
          .drop-in#{$sel} {
            background-color: $color;
          }
        }
        @media (prefers-color-scheme: dark) {
          .letter-tile#{$sel} {
            background-color: $lightColor;
          }
          
          .answer-slot#{$sel} {
            border-color: $lightColor;
          }
          .answer-widget .letter-length-indicator#{$sel} {
            border-color: $lightColor;
          }
          .answer-slot#{$sel}:after {
            color: $lightColor;
          }
          .drop-in#{$sel} {
            background-color: $lightColor;
          }
        }

        .theme-dark {
          .letter-tile#{$sel} {
            background-color: $lightColor;
          }
          
          .answer-slot#{$sel} {
            border-color: $lightColor;
          }
          .answer-widget .letter-length-indicator#{$sel} {
            border-color: $lightColor;
          }
          .answer-slot#{$sel}:after {
            color: $lightColor;
          }
          .drop-in#{$sel} {
            background-color: $lightColor;
          }
        }

        
    }
    .decrypt-container-label {
      font-family: $clueFontFamily;
      color: var(--clue-text-color);
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
    }
    .letter-container {
      width: 100%;
      min-height: calc(#{$gridCellSize} + 20px);
      padding-top: 8px;
      padding-left: 16px;
      padding-right: 8px;
      padding-bottom: 8px;

      .letter-length-indicator {
         position: absolute;
         justify-content: space-around;
         padding: 4px;
         font-size: 16px;
         min-width: 31px;
         max-height: 31px;
         bottom: .5em;
         right: .5em;
         color: var(--pencil-text-color);
      }
    }
    .letter-list {
      height: 100%;
    }
    .answer-widget {
      margin-top: auto;
      font-size: 26px;
      padding: 0px .5rem;
      width: 100%;
      .letter-length-indicator {
        width: 31px;
        height: 31px;
        color: var(--pencil-text-color);
        background: 
         linear-gradient(to top left,
             rgba(0,0,0,0) 0%,
             rgba(0,0,0,0) calc(50% - 0.5px),
             var(--pencil-text-color) 50%,
             rgba(0,0,0,0) calc(50% + 0.5px),
             rgba(0,0,0,0) 100%);
        background-size: 50% 50%;
        background-repeat: no-repeat;
        background-position: 50%;
        font-size: 12px;
        box-sizing: content-box;
        justify-content: space-between;
      }
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
      width: 31px;
      height: 31px;
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
      height: 100%;
      position: absolute;
      &:not([data-is-pencil]):before {
        top: 0;
        left: 0;
        width: 100%;
        line-height: 31px;
        text-align: center;
        content: attr(data-cell-contents);
        color: #888;
        position: absolute;
        z-index: -1;
      }
      &[data-is-pencil]:before {
        top: 0;
        left: 0;
        width: 100%;
        text-align: center;
        content: attr(data-cell-contents);
        position: absolute;
        z-index: -1;
        font-size: 1.55rem;
        padding-top: 4px;
        font-family: 'F*ck Beans';
        color: #888;
      }
      .letter-tile {
        position: absolute;
        top: 0;
        left: 0;
        margin-left: -1px;
        margin-top: -1px;
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
    standalone: Boolean,
    clue: {
      type: Object,
      default: function() {
        return {id: 'dummy', plainText: ''};
      }
    },
    answerSlots: {
      type: Object,
      default: function() {
        return {};
      }
    },
    workingLetters: {
      type: Object,
      default: function() {
        return {};
      }
    },
    solverid: {
        type: Number,
        default: 0
    },
    usingPencil: Boolean
  },
  watch: {
    clue(newClue, oldClue) {
      if (!newClue)
        return;
      if (!this.answerSlots[newClue.id])
        this.createAnswerSlots();
    }
  },
  computed: {
    plainCustomWord() {
       return this.customWord.replace(/[^A-Za-z]/g,'');
    },
    words() {
      if (!this.clue)
        return '';
      const words = this.clue.plainText.split(/[ -]/g);
      const plainWords = [];
      for (const w of words) {
        let plain = w.replace(/[^A-Za-z]/g,'');
        if (plain) {
           plainWords.push(plain);
        }
      }
      return plainWords;
    },
    answerCells() {
      let clue = this.clue;
      const cells = [];
      while (clue) {
        for (let i = 0; i < clue.cells.length; i++) {
          cells.push(clue.cells[i]);
        }
        clue = clue.nextRef;
      }
      return cells
    },
    solverMask: function () {
        return (1 << (this.solverid % 8));
    },
    numWorkingLetters() {
      if (!this.clue || !this.workingLetters[this.clue.id])
        return 0;
      return this.workingLetters[this.clue.id].length;
    },
    numAnswerLetters() {
      if (!this.clue || !this.answerSlots[this.clue.id])
        return 0;
      let n = 0;
      for (const s of this.answerSlots[this.clue.id]) {
        if (s.item && s.item.letter != '')
          n++;
      }
      return n;
    },
    highestId() {
      if (!this.clue)
        return 0;
      let id = 0;
      if (this.answerSlots[this.clue.id]) {
        for (const s of this.answerSlots[this.clue.id]) {
          if (s.item && s.item.id > id)
            id = s.item.id;
        }
      }
      if (this.workingLetters[this.clue.id]) {
        for (const l of this.workingLetters[this.clue.id]) {
          if (l.id > id)
            id = l.id;
        }
      }
      return id;
    },
    submitDisabled() {
      if (!this.clue || !this.answerSlots[this.clue.id]) {
        return true;
      }
      for (const slot of this.answerSlots[this.clue.id]) {
        if (slot.item && slot.item.letter)
          return false;
      }
      return true;
    },
  },
  methods: {
    createAnswerSlots() {
      if (!this.clue || !this.clue.cells)
        return;
      if (this.answerSlots[this.clue.id])
        return;
      this.$set(this.answerSlots, this.clue.id, []);
      let ref = this.clue;
      let j = 0;
      while (ref) {
        this.answerSlots[this.clue.id].splice(j + ref.cells.length);
        for (let i = 0; i < ref.cells.length; i++) {
          this.$set(this.answerSlots[this.clue.id], i + j, {item: null});
        }
        j += ref.cells.length;
        ref = ref.nextRef;
      }
      this.$emit('update:answerSlots', this.answerSlots);
    },
    clearClicked() {
      if (!this.clue)
        return;

      this.$set(this.workingLetters, this.clue.id, []);
      for (let i = 0; i < this.answerSlots[this.clue.id].length; i++) {
        this.$set(this.answerSlots[this.clue.id], i, {item: null});
      }
      this.$emit('update:answerSlots', this.answerSlots);
      this.$emit('update:workingLetters', this.workingLetters);
    },
    // https://stackoverflow.com/a/6274381
    shuffleClicked() {
      if (!this.clue)
        return;
      const a = this.workingLetters[this.clue.id];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = JSON.parse(JSON.stringify(a[i]));
        this.$set(a, i, {letter: a[j].letter, id: a[j].id});
        this.$set(a, j, {letter: tmp.letter, id: tmp.id});
      }
      this.$emit('update:workingLetters', this.workingLetters);
    },
    submitClicked() {
      const text = [];
      for (const slot of this.answerSlots[this.clue.id]) {
        text.push(slot.item ? slot.item.letter : '');
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
      let id = this.highestId + 1;
      for (const c of word) {
        this.$set(this.workingLetters[this.clue.id], i, {
          id: id,
          letter: c
        });
        id++;
        i++;
      }
      this.$emit('update:workingLetters', this.workingLetters);
    },
    openCustomModal() {
      this.$refs.customWordModal.open();
    },
    addCustomClicked() {
      this.explodeWord(this.plainCustomWord);
      this.$refs.customWordModal.close();
    },
    cutAnswerLetter(offset) {
      this.$set(this.answerSlots[this.clue.id], offset, {item: null});
      this.$emit('update:answerSlots', this.answerSlots);
    },
    cutWorkingLetter(item) {
      let offset = 0;
      for (const l of this.workingLetters[this.clue.id]) {
        if (l.id == item.id) {
          this.workingLetters[this.clue.id].splice(offset, 1);
          this.$emit('update:workingLetters', this.workingLetters);
          break;
        }
        offset++;
      }
    },
    insertFirstWorkingTile(event) {
      this.workingLetters[this.clue.id].splice(0, 0, {
        id: this.highestId,
        letter: event.data.letter,
      });
      this.$emit('update:workingLetters', this.workingLetters);
    },
    insertWorkingTile(event) {
      for (let offset = this.workingLetters[this.clue.id].length - 1; offset >= event.index; offset--)
      {
        this.$set(this.workingLetters[this.clue.id][offset], 'offset', offset + 1);
      }

      this.workingLetters[this.clue.id].splice(event.index, 0, {
        id: event.data.id,
        letter: event.data.letter,
      });
      this.$emit('update:workingLetters', this.workingLetters);
    },
    reorderWorkingTiles(event) {
      let reordered = [];
      for (let offset = 0; offset < this.workingLetters[this.clue.id].length; offset++) {
        reordered.push(JSON.parse(JSON.stringify(this.workingLetters[this.clue.id][offset])));
      }
      let temp = reordered[event.from];
      reordered.splice(event.from, 1);
      reordered.splice(event.to, 0, temp);

      this.$set(this.workingLetters, this.clue.id, reordered);
      this.$emit('update:workingLetters', this.workingLetters);
    },
    answerTileDropped(event, answerOffset) {
      this.$set(this.answerSlots[this.clue.id], answerOffset, {item: event.data})
      this.$emit('update:answerSlots', this.answerSlots);
    },
    separator: function (cell) {
        if (!cell || !this.clue)
          return '';

        let sep = this.clue.isAcross ? cell.sanitizedAcrossSeparator : cell.sanitizedDownSeparator;
        if ((!cell.clues.across || cell.clues.across.id != this.clue.id) &&
           (!cell.clues.down || cell.clues.down.id != this.clue.id)
           && cell.sanitizedRefSeparators) {
          sep = cell.sanitizedRefSeparators[this.clue.id];
        }
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
      customWord: ''
    };
  },
  mounted() {
    this.createAnswerSlots();
  }
});
</script>