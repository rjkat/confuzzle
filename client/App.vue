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
    <div id="app-content" ref="appContent" :data-portrait="isPortrait">
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
                :gridSize="gridSize"
                :isPortrait="isPortrait"
                @fill-cell="sendFillCell($event)">
            </ana-crossword-grid>
            <template v-if="state.compiling && !isPortrait">
                <ana-crossword-editor id="editor"
                    v-model="crosswordSource"
                    :loading="renderLoading"
                    :errorText="errorText"
                    :errorMessage="errorMessage"
                    @input="crosswordEdited()"
                    v-responsive.class>
                </ana-crossword-editor>
            </template>
            <template v-else>
                <div id="clue-container" :data-portrait="isPortrait">
                    <ana-crossword-clues id="clues"
                        :data-portrait="isPortrait"
                        :state="state"
                        :solvers="solvers"
                        :solverid="solverid"
                        v-model="crossword" 
                        @fill-cell="sendFillCell($event)"
                        v-responsive.class
                        >
                    </ana-crossword-clues>
                </div>
            </template>
        </template>
    </div>
    <ui-fab v-if="exploding"
        icon="close"
        tooltip="Make it stop"
        tooltipPosition="top"
        class="cancel-explosion-button"
        @click="cancelExplosions()"
        >
    </ui-fab>
    <ui-snackbar-container ref="snackbarContainer" id="snackbar" position="center"></ui-snackbar-container>
</div>
</template>

<style lang="scss">
body {
    background-color: rgb(240, 248, 255);
    height: 100%;
    width: 100%;
    position: fixed;
    top: 0px;
    margin: 8px;
    @media print {
        padding: 1.5cm !important;
    }
}

.cancel-explosion-button {
    position: fixed;
    left: 50%;
    margin-left: -1.75rem;
    bottom: $displayPadding;
}
.tippy-popper {
    font-family: $clueFontFamily;
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

#app-container {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
}

#app-toolbar {
    flex: none;
    margin-right: $displayPadding;
}

#app-content {
    display: flex;
    width: 100%;
    &[data-portrait] {
        min-height: 0;
        flex-direction: column;
    }
    width: 100%;
    @media print {
        display: block !important;
    }
}

#editor {
    margin-right: $displayPadding;
    margin-top: $displayPadding;
    overflow-x: scroll;
    border: 1px solid #000;
    flex: 1 1 50%;
    &.bs4-md, &.bs4-lg, &.bs4-xl {
        height: 80vh;
    }
}

#grid {
    @media screen {
        padding-top: $displayPadding;
    }
}
#clues {
    &:not([data-portrait]) {
        padding-top: $displayPadding;
    }
}
#clue-container {
    flex: 1 1 50%;
    min-height: 0;
    overflow-y: scroll;
   
    margin-bottom: $displayPadding;
    margin-right: $displayPadding;
    @media screen {
        border: 1px solid #000;
    }
    &:not([data-portrait]) {
        margin-top: $displayPadding;
        height: 80vh;
    }
    background-color: #fff;
}
</style>

<script>

import Vue from 'vue';

import KeenUI from 'keen-ui';
import 'keen-ui/dist/keen-ui.css';

Vue.use(KeenUI);

import responsive from 'vue-responsive'

Vue.use(responsive);

import AnaCrosswordClues from './components/AnaCrosswordClues.vue'
import AnaCrosswordGrid from './components/AnaCrosswordGrid.vue'
import AnaCrosswordEditor from './components/AnaCrosswordEditor.vue'
import AnaToolbar from './components/AnaToolbar.vue'

const parser = require('./js/parser.js');
import {readEno, enoToPuz} from './js/eno.js'
import {EnoError} from 'enolib'

import io from 'socket.io-client'

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
    gridSize: Number,
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
    isPortrait: false,
    joinLoading: false,
    shareLoading: false,
    renderLoading: false,
    exploding: false,
    solverName: "",
    errorText: "",
    errorMessage: "",
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
    },
    gridComplete() {
        const grid = this.crossword.grid;
        for (let row = 0; row < grid.height; row++) {
            for (let col = 0; col < grid.width; col++) {
                if (!grid.cells[row][col].empty
                    && grid.cells[row][col].contents == '') {
                    return false;
                }
            }
        }
        return true;
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
    },
    gridComplete(complete) {
        if (complete && !this.state.compiling && !this.$options.explosions) {
            if (this.crossword.meta.emoji && this.crossword.meta.emoji.length > 5) {
                this.$options.explosions = emojisplosions({
                    emojis: this.crossword.meta.emoji,
                });
            } else {
                this.$options.explosions = emojisplosions();
            }
            this.exploding = true;
        } else if (this.$options.explosions) {
            this.exploding = false;
            this.$options.explosions.cancel();
            this.$options.explosions = undefined;
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
  mounted() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleOrientationChange);
    this.handleOrientationChange();
    this.handleResize();
    this.gridSizeLocked = true;
  },
  data() {
    return {
      shortUrl: 'https://anagr.in/d/',
      bundler: "Parcel",
      copyMessage: 'Link copied to clipboard',
      snackbarDuration: 3000,
      windowWidth: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
      windowHeight: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
      gridSizeLocked: false
    };
  },
  methods: {
    // https://stackoverflow.com/a/11744120
    handleResize() {
        this.windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        this.windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        const w = this.windowWidth;
        const h = this.windowHeight;
        this.isPortrait = h > w;
        if (!this.gridSizeLocked)
            this.gridSize = this.isPortrait ? w : h;
    },
    handleOrientationChange() {
        const w = this.windowWidth;
        const h = this.windowHeight;
        this.isPortrait = !(window.orientation == -90 || window.orientation == 90);
        if (!this.gridSizeLocked)
            this.gridSize = this.isPortrait ? w : h;
    },
    cancelExplosions() {
        this.exploding = false;
        this.$options.explosions.cancel();
    },
    snackbarMessage(msg) {
        this.$refs.snackbarContainer.createSnackbar({
            message: msg,
            duration: this.snackbarDuration
        });
    },
    renderCrossword() {
        let errorText = '';
        let errorMessage = '';
        try {
            this.crossword = parser.parse(this.crosswordSource, this.state.compiling);
        } catch (err) {
            if (err instanceof EnoError) {
                errorText = 'Line ' + (err.cursor.line + 1) + ': ' + err.text;
                errorMessage = err.snippet;
            } else {
                errorText = 'Unexpected parser error. Ensure the crossword is valid. For example, check that all clues fit within the grid.';
                errorMessage = err.stack;
            }
        }
        this.errorText = errorText;
        this.errorMessage = errorMessage;
        this.gridSizeLocked = false;
        this.handleResize();
        this.gridSizeLocked = true;
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
        if (msg.joined) {
            this.snackbarMessage(msg.joined.name + ' joined the crossword');
        } else if (msg.disconnected) {
            for (let [clueid, clue] of Object.entries(this.crossword.clues)) {
                clue.clearHighlight(msg.disconnected.solverid);
            }
            this.snackbarMessage(msg.disconnected.name + ' left the crossword');
        }
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
        this.renderCrossword();

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
        this.renderCrossword();
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
        this.renderCrossword();
    },
    downloadClicked() {
        const puz = enoToPuz(this.crosswordSource);
        const puzbytes = puz.toBytes();
        const blob = new Blob([puzbytes], {type: "application/octet-stream"});
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