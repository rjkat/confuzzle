<template>
<div id="app-container">
    <ana-disconnected-modal
        ref="disconnectedModal"
        :reconnecting="joinLoading"
        :reconnectFailed="reconnectFailed"
        @stay-offline-clicked='goOffline()'
        @reconnect-clicked='reconnectClicked($event)'>
    </ana-disconnected-modal>
    <ana-toolbar
        id="app-toolbar"
        ref="toolbar"
        v-if="!state.joining"
        :metadata="crossword.meta"
        :shareLoading="shareLoading"
        :shareLink="shareLink"
        class="hidden-print"
        v-model="state"
        @share-clicked="shareClicked($event)"
        @go-offline-clicked='goOffline()'
        @download-puz-clicked="downloadPuzClicked()"
        @download-eno-clicked="downloadEnoClicked()"
        @copy-clicked="copyClicked()"
        @puz-file-uploaded="puzFileUploaded($event)"
        @eno-file-uploaded="enoFileUploaded($event)"
    >
    </ana-toolbar>
   
    <div id="app-content" ref="appContent" :data-portrait="isPortrait"
         @dragenter="dragEnterHandler"
         @dragover="dragOverHandler"
         @dragleave="dragLeaveHandler"
         @drop="dropHandler">
        <div id="drop-area" ref="dropArea">
            <h1>Drop here to solve</h1>
        </div>
        <template v-if="state.joining">
            <ui-modal ref="joinModal" @reveal="onJoinReveal()" title="Join Crossword" :dismissible="false">
                <div style="text-align: center;">
                    <p class="join-info-text">Join this crossword and collude with others in real time.</p>
                    <ui-textbox ref="nameBox" class="crossword-name-input" v-model="solverName" @keydown-enter="joinClicked(solverName)">
                            <b>0A</b> Your name ({{solverName ? solverName.length : 0}})
                    </ui-textbox> 
                    <ui-button :loading="joinLoading" color="primary" :disabled="!solverName" @click="joinClicked(solverName)">Join</ui-button>
                </div>
            </ui-modal>
        </template>
        <template v-else>
            <ana-crossword-grid id="grid"
                ref="grid"
                v-model="crossword"
                :data-portrait="isPortrait"
                :solverid="solverid"
                :gridSize="gridSize"
                :isPortrait="isPortrait"
                :showTooltips="showTooltips"
                @fill-cell="sendFillCell($event)"
                v-if="showGrid">
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
                <div id="clue-container" :data-portrait="isPortrait" :data-show-grid="showGrid">
                    <ana-crossword-clues id="clues" ref="clues"
                        :data-portrait="isPortrait"
                        :data-show-grid="showGrid"
                        :state="state"
                        :solvers="solvers"
                        :solverid="solverid"
                        :showDelete="!state.colluding"
                        :showTooltipToggle="!isPortrait && showGrid"
                        v-model="crossword" 
                        @fill-cell="sendFillCell($event)"
                        @toggles-changed="togglesChanged($event)"
                        @check-answer-clicked="checkAnswerClicked()"
                        @reveal-answer-clicked="revealAnswerClicked()"
                        @delete-all-clicked="deleteAllClicked()"
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
/*  
    @media print {
        padding: 1.5cm !important;
    }
*/
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

#app {
    position: fixed;
    top: $displayPadding;
    bottom: 0;
    width: 100%;
}

#app-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

#app-toolbar {
    flex: none;
    margin-right: $displayPadding;
}

#app-content {
    display: flex;
    &[data-portrait] {
        flex-direction: column;
    }
    width: 100%;
    height: calc(100% - 3.5rem - #{$displayPadding} - 8px);
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
    min-height: 0;
    max-height: calc(100% - #{$displayPadding});
}

#drop-area {
    position: absolute;
    width: calc(100% - #{$displayPadding});
    margin: 0;
    background: #fff;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    z-index: 99;
    pointer-events: none;
    background: repeating-linear-gradient(
      45deg,
      $pageBgColor,
      $pageBgColor 10px, $gridBlankColor 10px, $gridBlankColor 20px
    ) !important;
    &[data-drop-visible] {
        opacity: 1;
        pointer-events: auto;
    }
}

#grid {
    @media screen {
        padding-top: $displayPadding;
    }

    &:not([data-portrait]) {
        margin-bottom: $displayPadding;
    }
}

#clue-container {
    flex: 1 1 50%;
    min-height: 0;
    max-height: calc(100% - #{$displayPadding});
    overflow-y: scroll;
    margin-right: $displayPadding;
    @media screen {
        border: 1px solid #000;
    }

    &:not([data-show-grid])[data-portrait] {
        margin-top: $displayPadding;
    }
    &:not([data-portrait]) {
        margin-top: $displayPadding;
    }
    height: 100%;
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
import AnaDisconnectedModal from './components/AnaDisconnectedModal.vue'

const parser = require('./js/parser.js');
import {readEno, enoToPuz} from './js/eno.js'
import {EnoError} from 'enolib'

const {Manager} = require("socket.io-client");

import {emojisplosions} from "emojisplosion";

function parseAndBuild(input, compiling, options) {
    const cw = parser.parse(input, compiling, options);
    for (let [clueid, clue] of Object.entries(cw.clues)) {
      clue.highlightMask = 0;
      clue.selected = false;
      clue.showCorrect = false;
      clue.showIncorrect = false;
      clue.deselect = function (solverid) {
        solverid %= 8;
        this.selected = false;
        this.clearHighlight(solverid);
      };
      clue.select = function (solverid) {
        solverid %= 8;
        for (let [otherid, other] of Object.entries(cw.clues)) {
          if (otherid != clueid)
            other.deselect(solverid);
        }
        this.selected = true;
        this.highlight(solverid);
      };
      clue.highlight = function(solverid, recursive) {
        solverid %= 8;
        this.highlightMask |= (1 << solverid);
        for (let i = 0; i < this.cells.length; i++) {
          const cell = this.cells[i];
          if (this.isAcross) {
            cell.acrossMask |= (1 << solverid);
          } else {
            cell.downMask |= (1 << solverid);
          }
          cell.highlightMask = (cell.acrossMask | cell.downMask);
        }
        if (!recursive) {
          if (this.primary) {
            this.primary.highlight(solverid, true);
          } else {
            for (let j = 0; j < this.refs.length; j++) {
              this.refs[j].highlight(solverid, true);
            }
          }
        }
      };
      clue.clearHighlight = function(solverid, recursive) {
        solverid %= 8;
        for (let i = 0; i < this.cells.length; i++) {
          const cell = this.cells[i];
          if (this.isAcross) {
            cell.acrossMask &= ~(1 << solverid);
          } else {
            cell.downMask &= ~(1 << solverid);
          }
          cell.highlightMask = (cell.acrossMask | cell.downMask);
        }
        this.highlightMask &= ~(1 << solverid);
        if (!recursive) {
          if (this.primary) {
            this.primary.clearHighlight(solverid, true);
          } else {
            for (let j = 0; j < this.refs.length; j++) {
              this.refs[j].clearHighlight(solverid, true);
            }
          }
        }
      };
    }
    return cw;
}

const defaultCrossword = parseAndBuild(parser.sampleCrossword(), false);
export default Vue.extend({
  components: {
    AnaCrosswordClues,
    AnaCrosswordGrid,
    AnaCrosswordEditor,
    AnaToolbar,
    AnaDisconnectedModal
  },
  props: {
    gridid: String,
    gridSize: Number,
    solvers: {
        type: Object,
        default: function() {
            return {}
        }
    },
    state: {
        type: Object,
        default: function() {
            return {
                colluding: false,
                compiling: false,
                printing: false,
                joining: false,
                reconnecting: false
            };
        }
    },
    isPortrait: false,
    joinLoading: false,
    shareLoading: false,
    renderLoading: false,
    reconnectFailed: false,
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
        return !this.gridid ? "" : this.shortUrl + '/' + this.gridid;
    },

    selectedClue() {
        if (!this.crossword)
            return undefined;
        for (let [clueid, clue] of Object.entries(this.crossword.clues)) {
            if (clue.selected) {
                return clue;
            }
        }
        return undefined;
    },
    gridComplete() {
        if (!this.crossword)
            return false;
        const grid = this.crossword.grid;
        for (let row = 0; row < grid.height; row++) {
            for (let col = 0; col < grid.width; col++) {
                const cell = grid.cells[row][col];
                if (!cell.empty &&
                    (!cell.contents || (cell.solution && cell.solution.toUpperCase() != cell.contents.toUpperCase()))) {
                    return false;
                }
            }
        }
        return true;
    },
    crosswordState() {
        var state = '';
        var haveState = false;
        for (let [clueid, clue] of Object.entries(this.crossword.clues)) {
            var ans = '';
            var nfilled = 0;
            for (var i = 0; i < clue.cells.length; i++) {
                const cell = clue.cells[i];
                const c = clue.cells[i].contents;
                if (c) {
                    nfilled++;
                    ans += c.toUpperCase();
                } else {
                    ans += '-';
                }
            }

            /* if all cells are already in another clue with more filled-in
             * cells, don't write this one */
            var nneeded = nfilled;
            for (var i = 0; i < clue.cells.length; i++) {
                const cell = clue.cells[i];
                const otherClue = clue.isAcross ? cell.clues.down : cell.clues.across;
                if (!otherClue)
                    continue;
                var nother = 0;
                for (var j = 0; j < otherClue.cells.length; j++) {
                    if (otherClue.cells[j].contents) {
                        nother++;
                    }
                }
                if (nother > nfilled ) {
                    nneeded--;
                } else if (!clue.isAcross && nother == nfilled) {
                    // tiebreak, prefer across clues to down
                    nneeded--;
                }
            }

            if (nneeded > 0) {
                if (!haveState) {
                    haveState = true;
                    state = '\n# state\n';
                }
                state += '\n## ' + clueid + '\n';
                state += 'ans: ' + ans + '\n';
            }
        }
        return state;
    }
  },
  watch: {
    crosswordSource(newValue, oldValue) {
        localStorage.crosswordSource = newValue;
    },
    crosswordState(newValue, oldValue) {
        localStorage.crosswordState = newValue;
    },
    
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
    var shouldJoin = false;
    if (window.location.pathname != "/") {
        const pathParts = window.location.pathname.split('/');
        if (pathParts.length > 1) {
            this.gridid = pathParts[1];
            shouldJoin = true;
        }
    } else {
        if (localStorage.crosswordSource) {
            this.crosswordSource = localStorage.crosswordSource;
            if (localStorage.crosswordState) {
                this.crosswordSource += localStorage.crosswordState;
            }
        }
        this.renderCrossword();
    }
    if (shouldJoin) {
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
      shortUrl: window.location.hostname == 'anagrind.com' ? 'https://confuzzle.me' : window.location.origin,
      bundler: "Parcel",
      copyMessage: 'Link copied to clipboard',
      snackbarDuration: 3000,
      windowWidth: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
      windowHeight: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
      gridSizeLocked: false,
      dragCount: 0,
      solverid: 0,
      socketid: '',
      showGrid: true,
      showTooltips: true,
      toggleOptions: [{name: 'grid', label: 'grid'}, {name: 'tooltips', label: 'tooltips'}]
    };
  },
  methods: {
    togglesChanged(toggles) {
        this.showGrid = toggles.includes('grid');
        this.showTooltips = toggles.includes('tooltips');
    },
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
    onJoinReveal() {
        this.$refs.nameBox.focus();
    },
    createSocket() {
        const self = this;
        this.$options.manager = new Manager(window.location.origin, {
            reconnectionAttempts: 5
        });
        this.$options.manager.on('reconnect_failed', (err) => {
            this.lostConnection();
        });
        this.$options.socket = this.$options.manager.socket('/');

        this.$options.socket.on('connect', () => {
            if (!this.shareLoading) {
                this.$options.socket.emit('joinGrid', {
                    gridid: this.gridid,
                    name: this.solverName,
                    oldsocketid: this.socketid
                });
            }
            this.socketid = this.$options.socket.id;
        });

        this.$options.socket.on('disconnect', (reason) => {
          if (reason === 'io server disconnect') {
            this.lostConnection();
          }
        });

        this.handlers = {
            crosswordShared: 'shareSucceeded',
            fillCell: 'fillCell',
            selectionChanged: 'selectionChanged',
            gridJoined: 'gridJoined',
            noSuchGrid: 'lostConnection',
            solversChanged: 'solversChanged'
        };
        for (let [action, callback] of Object.entries(this.handlers)) {
            this.$options.socket.on(action, msg => {
                // console.log(msg);
                self[callback](msg);
            });
        }
        
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
            this.crossword = parseAndBuild(this.crosswordSource, this.state.compiling);
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

        // strip any state from the source, we have rendered it now
        this.crosswordSource = this.crosswordSource.split(/\n#\s+state\n/)[0];


        const grid = this.crossword.grid;
        for (let row = 0; row < grid.height; row++) {
            for (let col = 0; col < grid.width; col++) {
                const cell = grid.cells[row][col];
                if (!cell.clues) {
                    continue;
                }
                if (cell.clues.across) {
                    cell.clues.across.showCorrect = false;
                    cell.clues.across.showIncorrect = false;
                }
                if (cell.clues.down) {
                    cell.clues.down.showCorrect = false;
                    cell.clues.down.showIncorrect = false;
                }
            }
        }
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
    lostConnection() {
        if (this.$options.socket) {
            this.$options.socket.close();
            this.$options.socket = null;
        }
        if (this.state.reconnecting) {
            this.reconnectFailed = true;
            this.joinLoading = false;
            return;
        }
        if (!(this.shareLoading || this.state.colluding)) {
            return;
        }
        if (this.shareLoading) {
            this.$refs.toolbar.closeModal('shareModal');
            this.shareLoading = false;
        }
        if (this.state.colluding) {
            this.solvers = {};
        }
        const self = this;
        Vue.nextTick(() => self.$refs.disconnectedModal.open());
    },
    deleteAllClicked() {
        const grid = this.crossword.grid;
        for (let row = 0; row < grid.height; row++) {
            for (let col = 0; col < grid.width; col++) {
                const cell = grid.cells[row][col];
                cell.contents = '';
            }
        }
        this.renderCrossword();
    },
    checkAnswerClicked() {
        if (!this.selectedClue)
            return;

        var correct = true;
        for (var i = 0; i < this.selectedClue.cells.length; i++) {
            const cell = this.selectedClue.cells[i];
            if (cell.contents.toUpperCase() != cell.solution.toUpperCase()) {
                correct = false;
                break;
            }
        }

        this.selectedClue.showCorrect = correct;
        this.selectedClue.showIncorrect = !correct;
    },
    revealAnswerClicked() {
        if (!this.selectedClue)
            return;

        for (var i = 0; i < this.selectedClue.cells.length; i++) {
            const cell = this.selectedClue.cells[i];
            if (cell.solution) {
                cell.contents = cell.solution;
            }
        }
        this.selectedClue.showIncorrect = false;
        this.selectedClue.showCorrect = false;
    },
    clearAllHighlighted() {
        for (let [clueid, clue] of Object.entries(this.crossword.clues)) {
            for (var i = 0; i < 8; i++) {
                clue.clearHighlight(i);
            }
        }
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
        this.crossword.clues[msg.clueid].showIncorrect = false;
        this.crossword.clues[msg.clueid].showCorrect = false;
        this.crossword.clues[msg.clueid].cells[msg.offset].contents = msg.value;
    },
    sendUpdate(event) {
        if (this.$options.socket) {
            if (!this.$options.socket.connected) {
                this.lostConnection();
            } else {
                try {
                    this.$options.socket.emit(event.action, event);
                } catch (err) {
                    this.lostConnection();
                }
            }
        }
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
    replayEvents(eventLog) {
        if (!eventLog)
            return;
        for (let i = 0; i < eventLog.length; i++) {
            const event = eventLog[i];
            if (event.action == 'selectionChanged') {
                // disable replaying selections for now
                // this.selectionChanged(event);
            } else if (event.action == 'fillCell') {
                this.fillCell(event);
            }
        }
    },
    gridJoined(msg) {
        this.solvers = msg.solvers;
        this.solverid = msg.solverid;
        this.gridid = msg.gridid;

        this.crosswordSource = msg.crossword.source;
        if (msg.crossword.state) {
            this.crosswordSource += msg.crossword.state;
        }
        this.renderCrossword();
        this.replayEvents(msg.events);

        this.state.joining = false;
        
        this.joinLoading = false;
        this.state.colluding = true;
        this.state.compiling = false;

        if (this.state.reconnecting) {
            this.$refs.disconnectedModal.close();
            this.reconnectFailed = false;
            this.state.reconnecting = false;
        } 
    },
    joinClicked(name) {
        this.joinLoading = true;
        this.createSocket();
    },
    shareClicked(name) {
        const self = this;
        if (this.state.compiling) {
            this.state.compiling = false;
            this.renderCrossword();
        }
        this.createSocket();
        this.solverName = name;
        this.shareLoading = true;
        this.$options.socket.emit('shareCrossword', {
            crossword: {
                source: this.crosswordSource,
                state: this.crosswordState
            },
            name: name
        });
    },
    shareSucceeded(msg) {
        this.gridid = msg.gridid;
        this.solvers = msg.solvers;
        window.history.replaceState(null, window.location.hostname, '/' + msg.gridid);
        this.state.colluding = true;
        this.shareLoading = false;
    },
    goOffline() {
        this.gridid = '';
        this.state.colluding = false;
        window.history.replaceState(null, window.location.hostname, '/');
        if (this.$options.socket) {
            this.$options.socket.close();
        }
        this.$options.socket = null;
        this.$refs.disconnectedModal.close();
        this.clearAllHighlighted();
        this.snackbarMessage('You left the crossword');
    },
    reconnectClicked(event) {
        this.state.reconnecting = true;
        this.createSocket();
        this.joinClicked(this.solverName);
    },
    dragEnterHandler(event) {
        this.dragCount++;
        if (!this.state.colluding) {
            this.$refs.dropArea.dataset.dropVisible = "";
        }
        event.preventDefault();
        event.stopPropagation();
    },
    dragOverHandler(event) {
        event.preventDefault();
        event.stopPropagation();
    },
    dragLeaveHandler(event) {
        this.dragCount--;
        if (this.dragCount <= 0) {
            this.$refs.dropArea.removeAttribute('data-drop-visible');
            this.dragCount = 0;
        }
        event.preventDefault();
        event.stopPropagation();
    },
    dropHandler(event) {
        if (!event.dataTransfer.files)
            return;

        if (!this.state.colluding) {
            const file = event.dataTransfer.files[0];
            const self = this;
            if (file.name.endsWith('.eno')) {
                file.arrayBuffer().then(buf => self.enoFileUploaded(buf))
            } else {
                file.arrayBuffer().then(buf => self.puzFileUploaded(buf))
            }
            this.dragCount = 0;
            this.$refs.dropArea.removeAttribute('data-drop-visible');
        }
        
        event.preventDefault();
    },
    enoFileUploaded(buf) {
        this.crosswordSource = Buffer.from(buf).toString('utf8');
        this.renderCrossword();
    },
    puzFileUploaded(buf) {
        this.crosswordSource = readEno(new Uint8Array(buf));
        this.renderCrossword();
    },
    downloadPuzClicked() {
        const puz = enoToPuz(this.crosswordSource + this.crosswordState);
        const puzbytes = puz.toBytes();
        const blob = new Blob([puzbytes], {type: "application/octet-stream"});
        this.downloadCrossword(blob, '.puz');
    },
    downloadEnoClicked() {
        const blob = new Blob([this.crosswordSource + this.crosswordState], {type: "text/plain"});
        this.downloadCrossword(blob, '.eno')
    },
    downloadCrossword(blob, extension) {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        const basename = this.crossword.meta.name + ' by ' + this.crossword.meta.author;
        const filename = basename + extension;
        link.download = filename;
        link.click();
    },
    copyClicked() {
        this.snackbarMessage(this.copyMessage);
    }
  }
});
</script>