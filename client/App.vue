<template>
<div id="app-container">
    <ana-toolbar
        id="app-toolbar"
        v-if="!state.joining"
        :metadata="crossword.meta"
        :shareLoading="shareLoading"
        :shareLink="shareLink"
        class="hidden-print"
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
            <template v-if="state.compiling">
                <ana-crossword-editor id="editor"
                    v-model="crosswordSource"
                    :loading="renderLoading"
                    @input="crosswordEdited()">
                </ana-crossword-editor>
            </template>
            <template v-else>
                <div id="clue-container">
                    <ana-solver-list v-if="state.colluding" class="hidden-print" :solvers="solvers"></ana-solver-list>
                    <ana-crossword-clues id="clues"
                        :solverid="solverid"
                        v-model="crossword" 
                        @fill-cell="sendFillCell($event)">
                    </ana-crossword-clues>
                </div>
            </template>
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
    @media screen {
        padding-top: $displayPadding;
    }
    flex: none;
}
#clues {
    min-width: 20em;
    height: 100%;
    overflow-y: scroll;
    background-color: #fff;
    margin-top: $displayPadding;

    @media screen {
        padding-top: $displayPadding;
        margin-left: $displayPadding;
        border: 1px solid #000;
    }
}
#clue-container {
    align-items: stretch;
    @media screen {
        max-height: 70vh;
    }
}
</style>

<script>

import Vue from 'vue';

import KeenUI from 'keen-ui';
import 'keen-ui/dist/keen-ui.css';

Vue.use(KeenUI);

import AnaCrosswordClues from './components/AnaCrosswordClues.vue'
import AnaCrosswordGrid from './components/AnaCrosswordGrid.vue'
import AnaCrosswordEditor from './components/AnaCrosswordEditor.vue'
import AnaToolbar from './components/AnaToolbar.vue'
import AnaSolverList from './components/AnaSolverList.vue'

const parser = require('./js/parser.js');
import {readEno, enoToPuz} from './js/eno.js'

import io from 'socket.io-client';

const defaultCrossword = parser.parse(parser.sampleCrossword(), false);
export default Vue.extend({
  components: {
    AnaCrosswordClues,
    AnaCrosswordGrid,
    AnaCrosswordEditor,
    AnaToolbar,
    AnaSolverList
  },
  props: {
    gridid: String,
    solverid: {
        type: Number,
        default: 0,
    },
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
    renderLoading: false,
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
    },
    selectedClue() {
        for (let [clueid, clue] of Object.entries(this.crossword.clues)) {
            if (clue.selected) {
                return clue;
            }
        }
        return undefined;
    }
  },
  watch: {
    selectedClue(newValue, oldValue) {
        if (oldValue) {
            this.sendUpdate({
                action: 'selectionChanged',
                clueid: oldValue.id,
                solverid: this.solverid,
                selected: false
            });
        }
        if (newValue) {
            this.sendUpdate({
                action: 'selectionChanged',
                clueid: newValue.id,
                solverid: this.solverid,
                selected: true
            });
        }
    }
  },
  created() {
    const self = this;
    this.$options.socket = io(window.location.host);
    this.handlers = {
        crosswordShared: 'shareSucceeded',
        fillCell: 'fillCell',
        selectionChanged: 'selectionChanged',
        gridJoined: 'gridJoined',
        solversChanged: 'solversChanged'
    };
    for (let [action, callback] of Object.entries(this.handlers)) {
        this.$options.socket.on(action, msg => self[callback](msg));
    }
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
    snackbarMessage(msg) {
        this.$refs.snackbarContainer.createSnackbar({
            message: msg,
            duration: this.snackbarDuration
        });
    },
    renderCrossword() {
        this.crossword = parser.parse(this.crosswordSource, this.state.compiling);
        this.renderLoading = false;
    },
    crosswordEdited() {
        const self = this;
        clearTimeout(self.editDebounce)
        this.renderLoading = true;
        self.editDebounce = setTimeout(
           self.renderCrossword,
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
    solversChanged(msg) {
        this.solvers = msg.solvers;
    },
    fillCell(msg) {
        this.crossword.clues[msg.clueid].cells[msg.offset].contents = msg.value;
    },
    sendUpdate(event) {
        this.$options.socket.emit(event.action, event);
    },
    sendFillCell(event) {
        this.sendUpdate({
            action: 'fillCell',
            solverid: this.solverid,
            clueid: event.clueid,
            offset: event.offset,
            value: event.value
        });
    },
    gridJoined(msg) {
        this.solvers = msg.solvers;
        this.solverid = msg.solverid;
        this.gridid = msg.gridid;

        this.crosswordSource = msg.crossword;
        this.crossword = parser.parse(msg.crossword, false);

        this.state.joining = false;
        this.joinLoading = false;
        this.state.colluding = true;
        this.state.compiling = false;

        for (let i = 0; i < msg.events.length; i++) {
            const event = msg.events[i];
            if (event.action == 'fillCell') {
                this.fillCell(event);
            } else if (event.action == 'selectionChanged') {
                this.selectionChanged(event);
            }
        }
    },
    joinClicked(name) {
        this.joinLoading = true;
        this.$options.socket.emit('joinGrid', {gridid: this.gridid, name: name});
    },
    shareClicked(name) {
        const self = this;
        this.state.compiling = false;
        this.crossword = parser.parse(this.crosswordSource, this.state.compiling);
        this.shareLoading = true;
        this.$options.socket.emit('shareCrossword', {crossword: this.crosswordSource, name: name});
    },
    shareSucceeded(msg) {
        this.gridid = msg.gridid;
        this.solvers = msg.solvers;
        window.history.replaceState(null, 'anagrind.com', '/grid/' + msg.gridid);
        this.state.colluding = true;
        this.shareLoading = false;
    },
    puzFileUploaded(buf) {
        this.crosswordSource = readEno(new Uint8Array(buf));
        this.crossword = parser.parse(this.crosswordSource, this.state.compiling);
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