<template>
<div>
    <ana-toolbar :metadata="crossword.meta" v-model="compiling"></ana-toolbar>
    <div class="content">
        <div id="grid-container">
            <div>
                <ana-crossword-grid id="grid"
                    v-model="crossword"
                    @fill-cell="fillCell($event)">
                </ana-crossword-grid>
            </div>
            <ana-crossword-editor id="editor"
                v-if="compiling"
                v-model="crosswordSource"
                @input="crosswordEdited()">
            </ana-crossword-editor>
            <ana-crossword-clues id="clues"
                v-else
                v-model="crossword" 
                @fill-cell="fillCell($event)">
            </ana-crossword-clues>
        </div>
    </div>
</div>
</template>

<style lang="scss">
#grid-container {
    display: flex;
    justify-content: flex-start;
    height: 100%;
}

#editor {
    max-height: 30em;
    overflow-x: scroll;
}

#grid {
    flex: none;
}
#clues {
    margin-left: $displayPadding;
    margin-top: $displayPadding;
}
</style>

<script>

import Vue from 'vue';

import 'keen-ui/src/bootstrap';
import KeenUI from 'keen-ui/src';

Vue.use(KeenUI);

import AnaCrosswordClues from './components/AnaCrosswordClues.vue'
import AnaCrosswordGrid from './components/AnaCrosswordGrid.vue'
import AnaCrosswordEditor from './components/AnaCrosswordEditor.vue'
import AnaToolbar from './components/AnaToolbar.vue'

const parser = require('./js/parser.js');
import {readEno, enoToPuz} from './js/eno.js'

const defaultCrossword = parser.parse(parser.sampleCrossword(), false);
export default Vue.extend({
  components: {
    AnaCrosswordClues,
    AnaCrosswordGrid,
    AnaCrosswordEditor,
    AnaToolbar
  },
  props: {
    gridid: String,
    solverid: Number,
    solvers: Object,
    compiling: {
        type: Boolean,
        default: false
    },
    crossword: {
        type: Object,
        default: function () { return defaultCrossword }
    },
    crosswordSource: {
        type: String,
        default: parser.sampleCrossword()
    }
  },
  data() {
    return {
      bundler: "Parcel"
    };
  },
  methods: {
    isSelected(clueid) {
        if (clueid == this.selectedid) {
            return true;
        }
        const refs = this.crossword.clues[clueid].refIds;
        if (refs) {
            for (var i = 0; i < refs.length; i++) {
                if (refs[i] == this.selectedid) {
                    return true;
                }
            }
        }
        return false;
    },
    crosswordEdited() {
        console.log('edit');
        const self = this;
        clearTimeout(self.editDebounce)
        self.editDebounce = setTimeout(
           () => {
              self.crossword = parser.parse(self.crosswordSource, true);
           },
           500
        );
    },
    clearOwnHighlight(clueid, force) {
        if (!clueid) {
            return;
        }
        if (force || !this.isSelected(clueid)) {
            // this.clues.clearHighlightClue(clueid);
            this.grid.clearHighlightClue(clueid, this.solverid);
        }
    },
    drawOwnHighlight(clueid, scroll) {
        if (!clueid) {
            return
        }
        // this.clues.highlightClue(clueid, scroll);
        this.grid.highlightClue(clueid, this.solverid);
    },
    // remote solver has changed their selection
    selectionChanged(msg) {
        if (msg.selected) {
            this.grid.highlightClue(msg.clueid, msg.solverid);
        } else {
            this.grid.clearHighlightClue(msg.clueid, msg.solverid);
        }
    },
    // local solver has changed their selection
    selectClue(clueid, scroll) {
        this.callbacks.onSelectionChanged(false, this.solverid, this.selectedid);
        this.clearOwnHighlight(this.selectedid, true);
        this.selectedid = clueid;
        this.drawOwnHighlight(this.selectedid, scroll);
        this.callbacks.onSelectionChanged(true, this.solverid, this.selectedid);
    },
    fillCell(event) {
        // console.log(event);
        // this.client.sendUpdate({
        //     action: 'fillCell',
        //     solverid: this.solverid,
        //     clueid: clueid,
        //     offset: offset,
        //     value: value
        // });
    },
    gridJoined(msg) {
        this.solverid = msg.solverid;
        this.gridid = msg.gridid;
        this.solvers = msg.solvers;
        // remove #join from URL
        history.replaceState(null, null, ' ');
    },
    joinClicked(name) {
        const self = this;
        this.client.joinGrid(this.gridid, name, function (msg) {
            self.gridJoined(msg);
        });
    },
    colludeClicked(name) {
        const self = this;
        this.client.shareCrossword(this.crosswordSource, name, function (msg) {
            self.shareSucceeded(msg);
        });
    },
    puzFileUploaded(buf) {
        this.crosswordSource = readEno(new Uint8Array(buf));
    },
    downloadClicked() {
        const puz = enoToPuz(this.crosswordSource);
        const puzbytes = puz.toBytes();
        const blob = new Blob([puzbytes], {type: "application/x-crossword"});
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        const filename = this.crossword.meta.name + '.puz';
        link.download = filename;
        link.click();
    }
  }
});
</script>