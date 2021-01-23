<template>
<div id="app-container">
    <cfz-disconnected-modal
        ref="disconnectedModal"
        :reconnecting="joinLoading"
        :reconnectFailed="reconnectFailed"
        @stay-offline-clicked='goOffline()'
        @reconnect-clicked='reconnectClicked($event)'>
    </cfz-disconnected-modal>
    <cfz-header-toolbar
        id="header-toolbar"
        ref="toolbar"
        v-if="!state.joining"
        :metadata="crossword.meta"
        :shareLoading="shareLoading"
        :shareLink="shareLink"
        :emojiText="emojiNotation"
        class="hidden-print"
        :state="state"
        :showInstall="installPrompt || (iOSSafari && !standalone)"
        @install-clicked="installClicked()"
        @share-clicked="shareClicked($event)"
        @copy-clicked="copyClicked($event)"
        @go-offline-clicked='goOffline()'
        @download-puz-clicked="downloadPuzClicked()"
        @download-eno-clicked="downloadEnoClicked()"
        @emoji-button-clicked="updateEmoji()"
        @copy-emoji-clicked="copyEmojiClicked()"
        @import-emoji-clicked="importEmojiClicked($event)"
        @export-eno-clicked="exportLinkClicked(getEnoParams())"
        @puz-file-uploaded="puzFileUploaded($event)"
        @emoji-file-uploaded="emojiFileUploaded($event)"
        @eno-file-uploaded="enoFileUploaded($event)"
    >
    </cfz-header-toolbar>
   
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
            <cfz-crossword-grid id="grid"
                ref="grid"
                v-model="crossword"
                :data-portrait="isPortrait"
                :solverid="solverid"
                :gridSize="gridSize"
                :isPortrait="isPortrait"
                :showTooltips="showTooltips"
                :showScratchpad="showScratchpad"
                @fill-cell="sendFillCell($event)"
                v-if="showGrid">
            </cfz-crossword-grid>
            <template v-if="state.compiling && !isPortrait">
                <cfz-crossword-editor id="editor"
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
                </cfz-crossword-editor>
            </template>
            <template v-else>
                <div id="clue-container" :data-portrait="isPortrait" :data-show-grid="showGrid">
                    <cfz-control-toolbar
                     v-on="$listeners"
                     id="control-toolbar"
                     :showEdit="!state.colluding"
                     :showDelete="false"
                     :showScratchpad="showScratchpad"
                     :showTooltipToggle="!isPortrait && showGrid && !showScratchpad"
                     :showTooltips="showTooltips"
                     :showGrid="showGrid"
                     @show-grid-changed="showGridChanged($event)"
                     @show-tooltips-changed="showTooltipsChanged($event)"
                     @check-word-clicked="checkWordClicked(false)"
                     @check-all-clicked="checkWordClicked(true)"
                     @reveal-word-clicked="revealWordClicked(false)"
                     @reveal-all-clicked="revealWordClicked(true)"
                     @edit-source-clicked="editSourceClicked()"
                     @clear-all-clicked="clearAllClicked()"
                     @show-scratchpad-changed="showScratchpadChanged($event)"
                     v-responsive.class
                     >
                    </cfz-control-toolbar>
                    <cfz-crossword-clues id="clues" ref="clues"
                        :data-portrait="isPortrait"
                        :data-show-grid="showGrid"
                        :state="state"
                        :solvers="solvers"
                        :solverid="solverid"
                        v-model="crossword" 
                        @fill-cell="sendFillCell($event)"
                        v-responsive.class
                        >
                    </cfz-crossword-clues>
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
        <div class="install-tooltip" data-show>Install Confuzzle and solve offline.<br>Tap <svg xmlns="http://www.w3.org/2000/svg" fill="#fff" height="25" viewBox="0 0 50 50" enable-background="new 0 0 50 50"><path d="M30.3 13.7L25 8.4l-5.3 5.3-1.4-1.4L25 5.6l6.7 6.7z"/><path d="M24 7h2v21h-2z"/><path d="M35 40H15c-1.7 0-3-1.3-3-3V19c0-1.7 1.3-3 3-3h7v2h-7c-.6 0-1 .4-1 1v18c0 .6.4 1 1 1h20c.6 0 1-.4 1-1V19c0-.6-.4-1-1-1h-7v-2h7c1.7 0 3 1.3 3 3v18c0 1.7-1.3 3-3 3z"/></svg> and then 'Add to Home Screen'.<ui-icon class="install-close-button">close</ui-icon></div>
        <div class="install-tooltip-arrow" data-popper-arrow></div>
    </div>

</div>
</template>

<style lang="scss">
body {
    background-color: rgb(240, 248, 255);
    height: 100%;
    width: 100%;
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
    svg {
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

#app-container {
    position: fixed;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

#header-toolbar {
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

#control-toolbar {
    position: sticky;
    top: 0;
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
    overflow-y: hidden;
    max-height: calc(100% - #{$displayPadding});
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

#clues {
    height: 100%;
    overflow-y: scroll;
}
</style>

<script>

import Vue from 'vue';

import KeenUI from 'keen-ui';
import 'keen-ui/dist/keen-ui.css';

Vue.use(KeenUI);

import responsive from 'vue-responsive'

Vue.use(responsive);

import CfzCrosswordClues from './components/CfzCrosswordClues.vue'
import CfzCrosswordGrid from './components/CfzCrosswordGrid.vue'
import CfzCrosswordEditor from './components/CfzCrosswordEditor.vue'
import CfzHeaderToolbar from './components/CfzHeaderToolbar.vue'
import CfzControlToolbar from './components/CfzControlToolbar.vue'
import CfzDisconnectedModal from './components/CfzDisconnectedModal.vue'

const parser = require('../@confuzzle/confuz-parser/parser');

const confuz = require('../@confuzzle/confuz-crossword/confuz');

const ShareablePuz = require('@confuzzle/puz-sharing').ShareablePuz;

import {EnoError} from 'enolib'

const {Manager} = require("socket.io-client");

import {emojisplosions} from "emojisplosion";

function parseAndBuild(input, compiling) {
    const cw = parser.parse(input, compiling);
    cw.acrossClues = [];
    cw.downClues = [];
    for (let [clueid, clue] of Object.entries(cw.clues)) {
      
      // populate cell across and down clues for convenience
      for (let cell of clue.cells) {
        if (cell.clues.acrossId)
            cell.clues.across = cw.clues[cell.clues.acrossId]
        if (cell.clues.downId)
            cell.clues.down = cw.clues[cell.clues.downId]
      }

      clue.refs = [];
      if (clue.primaryId && clue.primaryId != clueid) {
        clue.primary = cw.clues[clue.primaryId];
      }

      clue.idText = clue.numbering.clueText;
      if (!clue.verbatim && clue.refIds.length > 0 && clue.primaryId == clueid)
      {
         clue.idText = clue.refIds.join(', ');
      }

      let nextRefId = '';
      for (let i = 0; i < clue.refIds.length; i++) {
        if (clue.refIds[i] != clueid) {
          clue.refs.push(cw.clues[clue.refIds[i]]);
        } else {
          nextRefId = clue.refIds[i + 1];
        }
      }
      clue.nextRef = nextRefId ? cw.clues[nextRefId] : null;

      // populate crossword across and down clues for convenience
      if (clue.isAcross) {
          cw.acrossClues.push(clue);
      } else {
          cw.downClues.push(clue);
      }

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
        for (const [otherid, other] of Object.entries(cw.clues)) {
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
            this.primary.highlight(solverid);
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
            this.primary.clearHighlight(solverid);
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
    CfzCrosswordClues,
    CfzCrosswordGrid,
    CfzCrosswordEditor,
    CfzHeaderToolbar,
    CfzControlToolbar,
    CfzDisconnectedModal
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
        return confuz.stateFromClues(this.crossword.clues);
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
    const puz = params.get('puz');
    const strippedPuz = params.get('🧩');
    if (enoSource) {
        var eno = confuz.decompressURL(enoSource);
        const enoState = params.get('state');
        if (enoState) {
            eno += confuz.decompressURL(enoState);
        }
        this.crosswordSource = eno;
        this.sourceUpdated();
    } else if (puz) {
        this.crosswordSource = confuz.fromPuz(ShareablePuz.fromURL(puz));
        this.sourceUpdated();
    } else if (strippedPuz) {
        this.crosswordSource = confuz.fromPuz(ShareablePuz.fromEmoji(strippedPuz, true));
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
      exportEmojiMessage: '🧩✨ ➡️ 📋 ✅',
      snackbarDuration: 3000,
      windowWidth: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
      windowHeight: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
      gridSizeLocked: false,
      dragCount: 0,
      solverid: 0,
      socketid: '',
      showGrid: true,
      showTooltips: true,
      showScratchpad: false,
      toggleOptions: [{name: 'grid', label: 'grid'}, {name: 'tooltips', label: 'tooltips'}],
      iOSSafari: false,
      iOSPrompt: false,
      installPrompt: null,
      lastInputWasGrid: true,
      emojiNotation: ''
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
    getShareablePuz() {
        var eno = this.crosswordSource;
        var puz = confuz.toPuz(eno);
        if (!puz.state && !this.state.compiling) {
            eno += this.crosswordState;
            puz = confuz.toPuz(eno);
        }
        return puz;
    },
    getEmojiNotation() {
        return this.getShareablePuz().toEmoji(true);
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
    showScratchpadChanged(show) {
        this.showScratchpad = show;
    },
    showGridChanged(show) {
        this.showGrid = show;
    },
    showTooltipsChanged(show) {
        this.showTooltips = show;
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
        this.showScratchpad = false;

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
        this.crosswordSource = confuz.fromCrossword(this.crossword, {scramble: true});
        this.sourceUpdated();
    },
    unscrambleClicked() {
        this.crosswordSource = confuz.fromCrossword(this.crossword, {scramble: false});
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
    clearAllClicked() {
        const grid = this.crossword.grid;
        for (let row = 0; row < grid.height; row++) {
            for (let col = 0; col < grid.width; col++) {
                const cell = grid.cells[row][col];
                cell.contents = '';
            }
        }
        this.renderCrossword();
    },
    checkClue(clue) {
        if (!clue)
            return;

        var correct = true;

        if (clue.primary) {
            clue = clue.primary;
        }
        const startClue = clue;
        while (clue) {
            for (var i = 0; i < clue.cells.length; i++) {
                const cell = clue.cells[i];
                if (cell.contents.toUpperCase() != cell.solution.toUpperCase()) {
                    correct = false;
                    break;
                }
            }
            clue = clue.nextRef;
        }

        startClue.showCorrect = correct;
        startClue.showIncorrect = !correct;
    },
    revealClue(clue) {
        if (!clue)
            return;
        if (clue.primary) {
            clue = clue.primary;
        }
        const startClue = clue;
        while (clue) {
            for (var i = 0; i < clue.cells.length; i++) {
                const cell = clue.cells[i];
                if (cell.solution) {
                    cell.contents = cell.solution;
                    this.sendFillCell({
                        clueid: clue.id,
                        offset: i,
                        value: cell.solution
                    });
                }
            }
            clue.showIncorrect = false;
            clue.showCorrect = false;
            clue = clue.nextRef;
        }
    },
    checkWordClicked(checkAll) {
        if (!checkAll) {
           this.checkClue(this.selectedClue);
        } else {
            for (let [clueid, clue] of Object.entries(this.crossword.clues))
               this.checkClue(clue);
        }
    },
    revealWordClicked(revealAll) {
        if (!revealAll) {
           this.revealClue(this.selectedClue);
        } else {
            for (let [clueid, clue] of Object.entries(this.crossword.clues))
               this.revealClue(clue);
        }
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
    sendFillCell(event, wasGrid) {
        this.lastInputWasGrid = wasGrid;
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
      if (event.dataTransfer.files.length == 0)
        return;

      if (!event.dataTransfer.files[0].name)
        return;

      if (!this.state.colluding) {
        const file = event.dataTransfer.files[0];
        const self = this;
        if (file.name.endsWith('.eno') || file.name.endsWith('.confuz')) {
            file.arrayBuffer().then(buf => self.enoFileUploaded(buf))
        } else if (file.name.endsWith('.🧩')) {
            file.arrayBuffer().then(buf => self.emojiFileUploaded(buf))
        } else if (file.name.endsWith('.puz')) {
            file.arrayBuffer().then(buf => self.puzFileUploaded(buf))
        }
        this.$refs.dropArea.removeAttribute('data-drop-visible');
      }
      this.dragCount = 0;
      event.preventDefault();
    },
    enoFileUploaded(buf) {
        this.crosswordSource = Buffer.from(buf).toString('utf8');
        this.sourceUpdated();
    },
    emojiFileUploaded(buf) {
        const emoji = Buffer.from(buf).toString('utf8');
        this.crosswordSource = confuz.fromPuz(ShareablePuz.fromEmoji(emoji, true));
        this.sourceUpdated();
    },
    puzFileUploaded(buf) {
        this.crosswordSource = confuz.fromPuz(ShareablePuz.from(new Uint8Array(buf)));
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
        // open .puz
        } else if (e.key === "o" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            this.$refs.toolbar.openPuzzle();
        // export as emoji to clipboard
        } else if (e.key === "b" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            this.exportLinkClicked(this.getEmojiParams())
        // export full .puz binary to clipboard
        } else if (e.key === "u" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            this.exportLinkClicked(this.getPuzParams())
        // export eno to clipboard
        } else if (e.key == "i" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            this.exportLinkClicked(this.getEnoParams())
        }
    },
   
    downloadPuzClicked() {
        const blob = new Blob([this.getShareablePuz().toBytes(false)], {type: "application/octet-stream"});
        this.downloadCrossword(blob, '.puz');
    },
    downloadEnoClicked() {
        var eno = this.crosswordSource;
        if (!this.state.compiling) {
            eno += this.crosswordState;
        }
        const blob = new Blob([eno], {type: "text/plain"});
        this.downloadCrossword(blob, '.confuz')
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
    getEnoParams() {
        var params = '?source=' + confuz.compressURL(this.crosswordSource);
        if (!this.state.compiling && this.crosswordState) {
            params += '&state=' + confuz.compressURL(this.crosswordState);
        }
        return params;
    },
    getEmojiParams() {
        const stripped = true;
        return '?🧩=' + this.getShareablePuz().toEmoji(stripped);
    },
    getPuzParams() {
        const stripped = false;
        return '?puz=' + this.getShareablePuz().toURL(stripped);
    },
    updateEmoji() {
        this.emojiNotation = this.getEmojiNotation();
    },
    copyEmojiClicked() {
        navigator.clipboard.writeText(this.emojiNotation);
        this.snackbarMessage(this.exportEmojiMessage);
    },
    importEmojiClicked(emoji) {
        this.crosswordSource = confuz.fromPuz(ShareablePuz.fromEmoji(emoji, true));
        this.sourceUpdated();
    },
    exportLinkClicked(params) {
        const link = window.location.origin.replace(/\/$/, "") + params;
        navigator.clipboard.writeText(link);
        this.snackbarMessage(this.exportMessage);
    }
  }
});
</script>