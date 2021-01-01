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
        :state="state"
        :showInstall="installPrompt || (iOSSafari && !standalone)"
        @install-clicked="installClicked()"
        @share-clicked="shareClicked($event)"
        @go-offline-clicked='goOffline()'
        @download-puz-clicked="downloadPuzClicked()"
        @download-eno-clicked="downloadEnoClicked()"
        @copy-clicked="copyClicked()"
        @export-link-clicked="exportLinkClicked()"
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
                    ref="editor"
                    v-model="crosswordSource"
                    :loading="renderLoading"
                    :errorText="errorText"
                    :errorMessage="errorMessage"
                    :scrambled='crossword.meta.scramble != "none"'
                    @input="crosswordEdited()"
                    @preview-clicked="previewClicked()"
                    @scramble-clicked="scrambleClicked()"
                    @unscramble-clicked="unscrambleClicked()"
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
                        :showDelete="false"
                        :showEdit="!state.colluding"
                        :showTooltipToggle="!isPortrait && showGrid"
                        v-model="crossword" 
                        @fill-cell="sendFillCell($event)"
                        @toggles-changed="togglesChanged($event)"
                        @check-answer-clicked="checkAnswerClicked()"
                        @edit-source-clicked="editSourceClicked()"
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

    <div id="ios-install-prompt" v-if="iOSPrompt" @click="iOSPromptClicked()">
        <div class="install-tooltip" data-show>Install Confuzzle and solve offline.<br>Tap <img src="../server/public/images/share-apple.svg" height="25"> and then 'Add to Home Screen'.<ui-icon class="install-close-button">close</ui-icon></div>
        <div class="install-tooltip-arrow" data-popper-arrow></div>
    </div>

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

.install-tooltip {
    padding: 4px 8px;
    padding-right: 30px;
    font-size: 14px;
    text-transform: none;
    z-index: 10;
    background: #333;
    color: #fff;
    border-radius: 4px;
    font-family: $clueFontFamily;
    display: none;
    text-align: left;
    white-space: pre;
    text-align: center;
    img {
        vertical-align: middle;
    }

    .install-close-button {
        position: fixed;
        right: 0;
        transform: translateY(-50%);
    }

    &[data-show] {
        display: block !important;
        @media print {
            display: none !important;
        }
    }
}
.install-tooltip-arrow,
.install-tooltip-arrow::before {
  position: absolute;
  width: 8px;
  height: 8px;
  z-index: -1;
}

.install-tooltip-arrow {
  bottom: -4px;
  left: calc(50% - 4px);
}

.install-tooltip-arrow::before {
  content: '';
  transform: rotate(45deg);
  background: #333;
}

#ios-install-prompt {
    position: fixed;
    bottom: 4px;
    left: 50%;
    transform: translate(-50%);
    z-index: 90;
}

.ui-snackbar {
    z-index: 99;
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
import {readEno, enoToPuz, enoState, exportEno} from './js/eno.js'
import {EnoError} from 'enolib'

const {Manager} = require("socket.io-client");

import {emojisplosions} from "emojisplosion";

import base64url from "base64url";

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
    standalone: false,
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
        return enoState(this.crossword.clues);
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
    window.addEventListener('beforeinstallprompt', this.beforeInstall);

    // https://stackoverflow.com/a/29696509
    const ua = window.navigator.userAgent;
    const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    const webkit = !!ua.match(/WebKit/i);
    this.iOSSafari = iOS && webkit && !ua.match(/CriOS/i);

    this.standalone = window.navigator.standalone;
    document.addEventListener('keydown', this.keyListener);
    this.handleOrientationChange();
    this.handleResize();
    this.gridSizeLocked = true;

    const params = new URLSearchParams(window.location.search);
    const enoSource = params.get('source');
    if (enoSource) {
        var eno = base64url.decode(enoSource);
        const enoState = params.get('state');
        if (enoState) {
            eno += base64url.decode(enoState);
        }
        this.crosswordSource = eno;
        this.sourceUpdated();
    } else if (localStorage.crosswordSource) {
        this.crosswordSource = localStorage.crosswordSource;
        if (localStorage.crosswordState) {
            this.crosswordSource += localStorage.crosswordState;
        }
        this.sourceUpdated();
    }
  },
  data() {
    return {
      shortUrl: window.location.hostname == 'confuzzle.app' ? 'https://confuzzle.me' : window.location.origin,
      bundler: "Parcel",
      copyMessage: 'Shared link copied to clipboard',
      exportMessage: 'Crossword exported to clipboard',
      snackbarDuration: 3000,
      windowWidth: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
      windowHeight: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
      gridSizeLocked: false,
      dragCount: 0,
      solverid: 0,
      socketid: '',
      showGrid: true,
      showTooltips: true,
      toggleOptions: [{name: 'grid', label: 'grid'}, {name: 'tooltips', label: 'tooltips'}],
      iOSSafari: false,
      iOSPrompt: false,
      installPrompt: null
    };
  },
  methods: {
    beforeInstall(e) {
        e.preventDefault();
        this.installPrompt = e;
    },
    iOSPromptClicked() {
        this.iOSPrompt = false;
    },
    installClicked() {
        if (this.iOSSafari) {
            this.iOSPrompt = true;
        } else {
            if (!this.installPrompt)
                return
            
            this.installPrompt.prompt();

            this.installPrompt.userChoice.then((choiceResult) => {
                this.installPrompt = null;
            });
        }
    },
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
    previewClicked() {
        this.state.compiling = false;
    },
    editSourceClicked() {
        this.state.compiling = true;
    },
    redrawEditor() {
        Vue.nextTick(() => this.$refs.editor && this.$refs.editor.redraw());
    },
    scrambleClicked() {
        this.crosswordSource = exportEno(this.crossword, true);
        this.sourceUpdated();
    },
    unscrambleClicked() {
        this.crosswordSource = exportEno(this.crossword, false);
        this.sourceUpdated();
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
                this.sendFillCell({
                    clueid: this.selectedClue.id,
                    offset: i,
                    value: cell.solution
                });
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
        this.sourceUpdated();
    },
    puzFileUploaded(buf) {
        this.crosswordSource = readEno(new Uint8Array(buf));
        this.sourceUpdated();
    },
    sourceUpdated() {
        this.renderCrossword();
        this.redrawEditor();
    },
    keyListener(e) {
        // save .puz
        if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            this.downloadPuzClicked();
        } else if (e.key === "o" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            this.$refs.toolbar.openPuzzle();
        }
    },
    downloadPuzClicked() {
        var eno = this.crosswordSource;
        if (!this.state.compiling) {
            eno += this.crosswordState;
        }
        const puz = enoToPuz(eno);
        const puzbytes = puz.toBytes();
        const blob = new Blob([puzbytes], {type: "application/octet-stream"});
        this.downloadCrossword(blob, '.puz');
    },
    downloadEnoClicked() {
        var eno = this.crosswordSource;
        if (!this.state.compiling) {
            eno += this.crosswordState;
        }
        const blob = new Blob([eno], {type: "text/plain"});
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
    },
    exportLinkClicked() {
        var link = window.location.origin + '?source=' + base64url(this.crosswordSource);
        if (!this.state.compiling && this.crosswordState) {
            link += '&state=' + base64url(this.crosswordState);
        }
        navigator.clipboard.writeText(link);
        this.snackbarMessage(this.exportMessage);
    }
  }
});
</script>