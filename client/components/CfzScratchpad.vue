<template>
<div class="cfz-scratchpad-container" ref="container">
    <div class="decrypt-container-label">
      <span class="clue-id">{{clue.idText}}{{clue.isAcross ? 'A' : 'D'}}</span>
      {{clue.sanitizedText}}<span class="clue-length">{{clue.lengthText}}</span>
    </div>
    <div class="word-container" ref="words">
      <template v-for="(word, i) in words">
        <ui-button raised class="word-tile" @click="explodeWord(word)" :data-word-length="word.length"><span class="word-tile-text">{{word}}</span></ui-button>
      </template>
    </div>
    <div class="letter-widget" >
      <div class="letter-container" ref="letterContainer">
          <div v-for="letter in letters[clue.id]" :key="letter.id" :class="'working-slot letter-dropzone' + (letter ? ' draggable-dropzone--occupied' : '')">
            <div class="letter-tile" :data-letter-id="letter.id.toString()" :data-solver-mask="solverMask">
              {{letter.char}}
            </div>
          </div>
          <div class="letter-length-indicator" ref="lengthIndicator"></div>
      </div>
    </div>
    <div class="answer-widget" ref="answer">
      <div class="answer-cells">
            <div v-for="(letter, i) in droppedLetters[clue.id]" :key="letter.id" :class="'answer-slot letter-dropzone' + (letter.char ? ' draggable-dropzone--occupied' : '')" :data-cell-offset="letter.offset" :data-solver-mask="solverMask">
              <div class="answer-slot-contents" :data-cell-contents="clue.cells[letter.offset].contents">
                <div :class="letter.char ? 'letter-tile' : 'dummy-tile'" :data-solver-mask="solverMask" :data-letter-id="letter.id" ref="droppedTiles">{{letter.char}}</div>
              </div>
            </div>
      </div>
    </div>
    <div class="decrypt-button-container">
      <ui-button raised color="red" class="decrypt-button" :disabled="disableClear" icon="delete" @click="clearClicked()">Clear</ui-button>
      <ui-button raised color="primary" class="decrypt-button" :disabled="disableSubmit" icon="exit_to_app" @click="submitClicked()">Submit</ui-button>
    </div>
</div>
</template>


<style lang="scss">
@import '../stylesheets/solvers';
    .draggable-source--is-dragging {
      visibility: hidden;
    }
    .draggable--original {
      visibility: hidden;
    }
    .cfz-scratchpad-container {
        overflow-y: scroll;
        flex-direction: column;
        font-family: $answerFontFamily;
        text-transform: uppercase;
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
      width: 100%;
      padding-top: $displayPadding;
      text-align: center;
    }
    .decrypt-button {
      margin: 8px;
    }
    .word-tile {
      margin-right: 8px;
      margin-top: 8px;
      min-width: 0 !important;
      &:before {
        position: absolute;
        bottom: 4px;
        right: 4px;
        color: #888;
        content: attr(data-word-length);
        font-family: $answerFontFamily;
        font-size: 12px;
      }
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
      content: '';
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
      -webkit-user-select: none; 
      &:active {
        cursor: grabbing;
      }
    }
    @include each-solver using ($color, $lightColor, $sel) {
        .letter-tile#{$sel} {
            background-color: $color;
        }
        .answer-slot#{$sel} {
          border-color: $color;
        }
        .crossword-separator#{$sel} {
          color: $color;
        }
    }
    .decrypt-container-label {
      font-family: $clueFontFamily;
      text-transform: none;
      width: 100%;
    }
    .word-container {
      flex: none;
      display: flex;
      flex-wrap: wrap;
      padding: 8px;
    }
    .letter-widget {
      position: relative;
      border: 1px dashed #ddd;
      flex-shrink: 1;
      border-radius: 8px;
      margin-top: $displayPadding;
      margin-bottom: $displayPadding;
      font-size: $gridFontSize;
      min-height: calc(#{$gridCellSize} + 16px);
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
      overflow: auto;
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
      margin-bottom: $displayPadding;
      font-size: $gridFontSize;
      width: 100%;
    }
    .answer-cells {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
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
import { Plugins, Droppable } from '@shopify/draggable';

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
      if (!this.droppedLetters[this.clue.id]) {
        this.createDroppedLetters();
      }
      this.forceUpdateState();
    }
  },
  computed: {
    words() {
      const words = this.clue.sanitizedText.split(/[ -]/g);
      const plainWords = [];
      for (const w of words) {
        // https://stackoverflow.com/a/31779560
        let plain = w.replace(/[~`!@#$%^&*(){}\[\];:"'<,.>?\/\\|_+=-]/g,'');
        if (plain) {
           plainWords.push(plain);
        }
      }
      return plainWords;
    },
    solverMask: function () {
        return (1 << (this.solverid % 8));
    },
  },
  methods: {
    forceUpdateState() {
      this.$forceUpdate();
      this.recreateDroppable();
      this.disableClear = this.clearDisabled();
      this.disableSubmit = this.submitDisabled();
      this.updateLengthText();
    },
    createDroppedLetters() {
      this.droppedLetters[this.clue.id] = [];
      for (let i = 0; i < this.clue.cells.length; i++) {
        this.droppedLetters[this.clue.id].push({
          offset: i
        });
      }
    },
    clearClicked() {
      document.querySelectorAll('.letter-tile').forEach(e => e.remove());
      this.letters[this.clue.id] = [];
      this.createDroppedLetters();
      this.forceUpdateState();
    },
    updateLengthText() {
      if (!this.clue || !this.letters[this.clue.id]) {
        return '';
      }
      let len = 0;
      for (const l of this.letters[this.clue.id]) {
        if (l.char != '')
          len++;
      }
      this.$refs.lengthIndicator.innerText = len.toString();
    },
    clearDisabled() {
      if (!this.clue || !this.letters[this.clue.id]) {
        return true;
      }
      for (const l of this.letters[this.clue.id]) {
        if (l.char != '')
          return false;
      }
      return true;
    },
    submitDisabled() {
      if (!this.clue || !this.droppedLetters[this.clue.id]) {
        return true;
      }
      for (const l of this.droppedLetters[this.clue.id]) {
        if (l.char)
          return false;
      }
      return true;
    },
    submitClicked() {
      const text = [];
      for (const l of this.droppedLetters[this.clue.id]) {
        text.push(l.char);
      }
      this.$emit('submit-decrypt', {
        text: text,
        clue: this.clue
      });
      this.clearClicked();
    },
    recreateDroppable() {
      if (this.letterDrop) {
        this.letterDrop.destroy();
      }
      document.querySelectorAll('.draggable-dropzone--occupied').forEach(e => {
        e.classList.remove('draggable-dropzone--occupied');
      });
      this.$forceUpdate();
      this.letterDrop = new Droppable(this.$refs.container, {
        draggable: '.letter-tile',
        dropzone: '.letter-dropzone',
        plugins: [Plugins.Snappable],
      });
      this.letterDrop.on('droppable:start', this.letterGrabbed);
      this.letterDrop.on('droppable:returned', this.letterReturned);
      this.letterDrop.on('droppable:stop', this.letterDropped);
    },
    letterReturned(event) {
      // event.dropzone.classList.remove('draggable-dropzone--occupied');
      console.log('returned');
      // console.log(event);
    },
    letterGrabbed(event) {
      if (this.dragging)
        return;
      document.body.style.cursor = 'grabbing';
      this.dragging = true;
      if (event.dropzone.classList.contains('working-slot')) {
        this.fromLetters = true;
        const source = event.data.dragEvent.data.source;
        this.letterId = parseInt(source.dataset.letterId);
      } else {
        this.fromLetters = false;
        this.fromOffset = parseInt(event.dropzone.dataset.cellOffset);
        this.letterId = this.droppedLetters[this.clue.id][this.fromOffset].id;
      }
    },
    letterDropped(event) {
      document.body.style.cursor = '';
      this.dragging = false;
      this.returning = false;
      const dropzone = event.dropzone;
      const dragEvent = event.data.dragEvent.data;  
      const source = dragEvent.source;

      const toAnswer = dropzone.classList.contains('answer-slot');
      let letter = {};
      for (const l of this.letters[this.clue.id]) {
        if (l.id == this.letterId) {
          letter = l;
          break;
        }
      }
      // from letters
      if (this.fromLetters) {
          console.log('drag from letters ' + this.letterId);
          if (toAnswer) {
            const addAt = parseInt(dropzone.dataset.cellOffset);
            this.droppedLetters[this.clue.id][addAt].char = letter.char;
            this.droppedLetters[this.clue.id][addAt].id = letter.id;
            letter.char = '';
          }
      // from answer
      } else {
        const toRemove = this.fromOffset;
        console.log('drag from answer ' + toRemove);
        const l = this.droppedLetters[this.clue.id][toRemove];
        this.droppedLetters[this.clue.id][toRemove] = {
          offset: toRemove
        };
        if (!toAnswer) {
          letter.char = l.char;
        } else {
          const addAt = parseInt(dropzone.dataset.cellOffset);
          this.droppedLetters[this.clue.id][addAt] = {
            offset: addAt,
            id: this.letterId,
            char: letter.char
          }
        }
      }
      this.disableClear = this.clearDisabled();
      this.disableSubmit = this.submitDisabled();
      this.updateLengthText();
    },
    explodeWord(word) {
      if (!this.letters[this.clue.id]) {
        this.letters[this.clue.id] = [];
      }
      let i = this.letters[this.clue.id].length;
      for (const c of word) {
        this.letters[this.clue.id].push({
          id: i,
          char: c
        });
        i++;
      }
      this.forceUpdateState();
    },
    separator: function (cell) {
        if (!cell)
          return '';
        let sep = this.clue.isAcross ? cell.sanitizedAcrossSeparator : cell.sanitizedDownSeparator;
        if (!sep) {
            return null;
        }
        if (sep == ',') {
            sep = "&nbsp;";
        }
        return sep;
    }
  },
  data() {
    return {
      fromLetters: true,
      dragging: false,
      returning: false,
      disableClear: true,
      disableSubmit: true,
      workingLetters: [],
      letters: {},
      droppedLetters: {}
    };
  },
  mounted() {
    this.clearClicked();
    this.forceUpdateState();
    // this.letterS[this.clue.id]wap = new Swappable(this.$refs.letters, {
    //     draggable: '.letter-tile',
    //   });

    
    // // --- Draggable events --- //
    // swappable.on('drag:start', (evt) => {
    //   if (evt.originalSource.classList.contains('Block--typeStripes')) {
    //     evt.cancel();
    //   }
    // });
  }
});
</script>