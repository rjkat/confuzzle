<template>
  <div class="cfz-launcher-container">
      
      <div>
        <cfz-crossword-grid v-model="crossword" style="text-align: center; padding-top: 20vh; transform: scale(1.5,1.5)"></cfz-crossword-grid>
      </div>
      <div class="cfz-launcher-options-container">
        <div class="cfz-launcher-options">
          <div v-for="option in options" class="cfz-launcher-option">
            <ui-button :raised="true" :icon="option.icon" :tooltip="option.tooltip" class="cfz-launcher-button"
              @click.stop="optionClicked(option)">
              {{option.text}}
            </ui-button>
          </div>
          
        </div>

      </div>
      <input type="file" ref="fileInput"
            accept=".puz,.eno,.confuz"
            @change="handleFiles()"
            style="display: none">
      </input>
      <div class="cfz-launcher-options-container">
        <ui-fab v-if="showReturnButton"
          icon="close"
          class="cfz-launcher-return-button"
          @click.stop="$emit('return-to-app-clicked')"
          >
        </ui-fab>
      </div>
  </div>
</template>

<style lang="scss">
  .cfz-launcher-return-button {
    margin-top: 3rem;
  }
  .cfz-launcher-container {
    height: 100%;
    width: 100%;
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    flex-direction: column;
  }
  .cfz-launcher-options-container {
    width: 100%;
    display: flex;
    justify-content: space-around;

  }
  .cfz-launcher-options {
    width: 100%;
    max-width: 800px;
    margin-top: 20vh;
    justify-content: space-around;
    display: flex;
  }
  .cfz-launcher-option {
  }
  .cfz-launcher-button {
  }
</style>

<script>

import Vue from 'vue';
import CfzCrosswordGrid from './CfzCrosswordGrid.vue'

const builder = require('../../@confuzzle/confuz-parser/builder');

const defaultCrossword = builder.parseAndBuild(
`# meta
name: Launcher
author: RK
# grid
width: 3
height: 3
# clues

## 1A
row: 1
col: 1
ans: CON
lengths:
    - 3

## 2A
row: 2
col: 1
ans: FUZ
lengths:
    - 3

### numbering
clue:
grid:

## 3A
row: 3
col: 1
ans: ZLE
lengths:
    - 3

### numbering
clue:
grid:

## 1D
row: 1
col: 1
ans: CFZ
lengths:
    - 3

### numbering
clue: ?
grid: ?

## 2D
row: 1
col: 2
ans: OUL
lengths:
    - 3

### numbering
clue:
grid:

## 3D
row: 1
col: 3
ans: NZE
lengths:
    - 3

### numbering
clue:
grid:

`, true
);

for (const clue of ['1A', '2A', '3A']) {
  for (const solver of [0, 1]) {
    defaultCrossword.clues[clue].highlight(solver);
  }
}

export default Vue.extend({
  components: {
    CfzCrosswordGrid
  },
  props: {
    showReturnButton: Boolean,
    isPortrait: Boolean,
    showLeave: Boolean,
    loading: Boolean,
    crossword: {
        type: Object,
        default: function () { return defaultCrossword; }
    },
  },
  computed: {
    options() {
      const opt = [];
      if (!this.isPortrait)
        opt.push({
          text: "Create",
          icon: "edit",
          tooltip: "Compile your own crossword"
        });

      if (this.showLeave) {
        opt.push({
          text: "Leave",
          icon: "no_meeting_room",
          tooltip: "Leave group session"
        });
      } else {
        opt.push({
          text: "Join",
          icon: "meeting_room",
          tooltip: "Join a group session"
        });
      }
      opt.push({
        text: "Invite",
        icon: "group_add",
        tooltip: "Start a group session from a .puz file"
      });
      opt.push({
        text: "Solve",
        icon: "extension",
        tooltip: "Upload and solve puzzles"
      });
      
      return opt;
    }
  },
  methods: {
    optionClicked(option) {
      if (option.text == 'Solve') {
        this.$emit('return-to-app-clicked', false);
      } else if (option.text == 'Create') {
        this.$emit('return-to-app-clicked', true);
      } else if (option.text == 'Invite') {
        this.openPuzzle();
      } else if (option.text == 'Leave') {
        this.$emit('leave-session');
      } else if (option.text == 'Join') {
        this.$emit('join-session');
      }
    },
    openPuzzle() {
        this.$refs.fileInput.click();
    },
    handleFiles() {
        const self = this;
        let files = this.$refs.fileInput.files;
        const file = files[0];
        if (file.name.endsWith('.eno') || file.name.endsWith('.confuz')) {
            file.arrayBuffer().then(
                buffer => self.$emit('invite-eno', buffer)
            )
        } else {
            file.arrayBuffer().then(
                buffer => self.$emit('invite-puz', buffer)
            )
        }
    },
  },
  data() {
    return {
      bundler: "Parcel",
    };
  },
});
</script>