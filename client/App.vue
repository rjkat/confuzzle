<template>
<div id="app-container">
    <ana-toolbar
        id="app-toolbar"
        :metadata="crossword.meta"
        :shareLoading="shareLoading"
        :shareLink="shareLink"
        v-model="state"
        @share-clicked="shareClicked($event)"
        @download-clicked="downloadClicked()"
        @copy-clicked="copyClicked()"
        @puz-file-uploaded="puzFileUploaded($event)"
    >
    </ana-toolbar>
    <div id="app-content">
        <ana-crossword-grid id="grid"
            v-model="crossword"
            @fill-cell="fillCell($event)">
        </ana-crossword-grid>
        <ana-crossword-editor id="editor"
            v-if="state.compiling"
            v-model="crosswordSource"
            @input="crosswordEdited()">
        </ana-crossword-editor>
        <ana-crossword-clues id="clues"
            v-else
            v-model="crossword" 
            @fill-cell="fillCell($event)">
        </ana-crossword-clues>
    </div>
    <ui-snackbar-container ref="snackbarContainer" id="snackbar" position="center"></ui-snackbar-container>
</div>
</template>

<style lang="scss">
body {
    background-color: rgb(240, 248, 255);
}

#app-content {
    display: flex;
    justify-content: flex-start;
    @media print {
        display: block !important;
    }
}

#editor {
    margin-left: $displayPadding;
    margin-top: $displayPadding;
    max-height: 30em;
    overflow-x: scroll;
    width: 100vw;
    border: 1px solid #000;
}

#snackbar {
    position: absolute;
    width: 100%;
    margin-bottom: $displayPadding;
}

#grid {
    padding-top: $displayPadding;
    flex: none;
}
#clues {
    margin-top: $displayPadding;
    padding-top: $displayPadding;
    min-width: 20em;
    
    overflow-y: scroll;
    width: 100vw;
    background-color: #fff;

    @media screen {
        margin-left: $displayPadding;
        border: 1px solid #000;
        max-height: 80vh;
    }
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

import {AnagrindClient} from './js/client.js'

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
    state: {
        type: Object,
        default: function() {
            return {
                colluding: false,
                compiling: false,
                printing: false,
            };
        }
    },
    shareLoading: false,
    shareLink: "",
    crossword: {
        type: Object,
        default: function () { return defaultCrossword; }
    },
    crosswordSource: {
        type: String,
        default: parser.sampleCrossword()
    },
    client: Object
  },
  created() {
    this.$options.client = new AnagrindClient(this, window.location.host);
  },
  data() {
    return {
      shortUrl: 'https://anagr.in/d/',
      bundler: "Parcel",
      copyMessage: 'Link copied to clipboard',
      snackbarDuration: 3000
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
    snackbarMessage(msg) {
        this.$refs.snackbarContainer.createSnackbar({
            message: msg,
            duration: this.snackbarDuration
        });
    },
    crosswordEdited() {
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
        // this.$options.client.sendUpdate({
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
        this.$options.client.joinGrid(this.gridid, name, function (msg) {
            self.gridJoined(msg);
        });
    },
    shareClicked(name) {
        const self = this;
        this.shareLoading = true;
        this.$options.client.shareCrossword(this.crosswordSource, name, function (msg) {
            self.shareSucceeded(msg);
        });
    },
    shareSucceeded(msg) {
        this.shareLink = this.shortUrl + msg.gridid;
        window.history.replaceState(null, 'anagrind.com', '/grid/' + msg.gridid);
        this.state.colluding = true;
        this.shareLoading = false;
    },
    puzFileUploaded(buf) {
        this.crosswordSource = readEno(new Uint8Array(buf));
        this.crossword = parser.parse(this.crosswordSource, true);
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
    },
    copyClicked() {
        this.snackbarMessage(this.copyMessage);
    }
  }
});
</script>