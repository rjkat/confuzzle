<template>
<div id="app-container">
    <ana-toolbar
        id="app-toolbar"
        v-if="!state.joining"
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
        <template v-if="state.joining">
            <ui-modal ref="joinModal" title="Join Crossword" :dismissible="false">
                <div style="text-align: center;">
                    <p class="join-info-text">Join this crossword and collude with others in real time.</p>
                    <ui-textbox class="crossword-name-input" v-model="solverName">
                            <b>0A</b> Your name ({{solverName ? solverName.length : 0}})
                    </ui-textbox> 
                    <ui-button :loading="joinLoading" color="primary" :disabled="!solverName" @click="joinClicked(solverName)">Join</ui-button>
                </div>
            </ui-modal>
        </template>
        <template v-else>
            <ana-crossword-grid id="grid"
                v-model="crossword"
                :solverid="solverid"
                @fill-cell="sendFillCell($event)">
            </ana-crossword-grid>
            <ana-crossword-editor id="editor"
                v-if="state.compiling"
                v-model="crosswordSource"
                @input="crosswordEdited()">
            </ana-crossword-editor>
            <ana-crossword-clues id="clues"
                v-else
                :solverid="solverid"
                v-model="crossword" 
                @fill-cell="sendFillCell($event)">
            </ana-crossword-clues>
        </template>
    </div>
    <ui-snackbar-container ref="snackbarContainer" id="snackbar" position="center"></ui-snackbar-container>
</div>
</template>

<style lang="scss">
body {
    background-color: rgb(240, 248, 255);
}

.crossword-name-input {
    width: 10em;
    text-align: left;
    margin-left: auto;
    margin-right: auto;
    .ui-textbox__label-text {
        font-family: $clueFontFamily;
    }
    input {
        font-size: $gridFontSize;
        font-family: $answerFontFamily;
        text-transform: uppercase;
    }
}

.join-info-text {
    font-family: $clueFontFamily;
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
                joining: false
            };
        }
    },
    joinLoading: false,
    shareLoading: false,
    solverName: "",
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
  computed: {
    shareLink() {
        return !this.gridid ? "" : this.shortUrl + this.gridid;
    }
  },
  created() {
    this.$options.client = new AnagrindClient(this, window.location.host);
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length > 2 && (pathParts[1] == 'grid' || pathParts[1] == 'd')) {
        this.gridid = pathParts[2];
        this.state.joining = true;
        const self = this;
        Vue.nextTick(() => self.$refs.joinModal.open());
    }
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
    // remote solver has changed their selection
    selectionChanged(msg) {
        if (msg.selected) {
            this.crossword.clues[msg.clueid].highlight(msg.solverid);
        } else {
            this.crossword.clues[msg.clueid].clearHighlight(msg.solverid);
        }
    },
    fillCell(clueid, offset, value) {
        this.crossword.clues[clueid].cells[offset].contents = value;
    },
    sendFillCell(event) {
        this.$options.client.sendUpdate({
            action: 'fillCell',
            solverid: this.solverid,
            clueid: event.clueid,
            offset: event.offset,
            value: event.value
        });
    },
    gridJoined(msg, solvers) {
        this.crossword = parser.parse(msg.crossword, false);
        this.solvers = solvers;
        this.solverid = msg.solverid;
        this.gridid = msg.gridid;
        this.state.joining = false;
        this.joinLoading = false;
        this.state.colluding = true;
    },
    joinClicked(name) {
        this.joinLoading = true;
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
        this.gridid = msg.gridid;
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