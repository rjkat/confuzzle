<template>
<div id="app-container" ref="appContainer">
    <transition name="launcher">
        <cfz-launcher ref="launcher" v-if="state.launching"
            :showReturnButton="!firstLaunch"
            :isPortrait="isPortrait"
            :showLeave="state.colluding"
            @return-to-app-clicked="returnFromLauncher($event)"
            @solve-clicked="openPuzzleFromLauncher('solve')"
            @edit-clicked="openPuzzleFromLauncher('create')"
            @invite-clicked="openPuzzleFromLauncher('invite')"
            @leave-session="leaveSessionFromLauncher($event)"
            @join-session="joinSessionFromLauncher()"
        >
        </cfz-launcher>
    </transition>
    <ui-modal ref="puzzleModal" :title="puzzleModalTitle">
        <cfz-file-input ref="fileInput"
            @puz-file-uploaded="puzFileUploaded($event)"
            @emoji-file-uploaded="emojiFileUploaded($event)"
            @eno-file-uploaded="enoFileUploaded($event)"
            @file-uploaded="returnFromLauncher()">
        </cfz-file-input>
        <template v-if="launchOption == 'create'">
            <p class="join-info-text">Start from an example crossword<ui-button color="primary" style="margin-left: 1em;" @click="openSampleFromLauncher">Edit</ui-button></p>
        </template>
        <template v-else>
            <p class="join-info-text">Try a sample crossword<ui-button color="primary" style="margin-left: 1em;" @click="openSampleFromLauncher">Open</ui-button></p>
        </template>
        <p class="join-info-text">Open .puz or .confuz file <ui-button color="primary" @click="browseClicked()" style="margin-left: 1em">Browse...</ui-button></p>
        <template v-if="recentMetas && recentMetas.length > 0">
            <p class="join-info-text">Choose from recent crosswords</p>
            <div class="recent-crossword-list">
                <ul>
                    <li is="ui-button" raised @click="openFromLauncher(m.id)" class="file-tile" v-for="m in recentMetas">
                        <div class="file-tile-text">
                            <span class="file-tile-name">{{m.name}}</span>
                            <span class="file-tile-author">{{m.author}}</span>
                        </div>
                    </li>
                </ul>
            </div>
        </template>
        <p class="join-info-text">Discover publishers of .puz files at <a href="https://crosswordlinks.substack.com/about" target="_blank" rel="noopener">Daily Crossword Links<ui-icon style="font-size: 12pt;">open_in_new</ui-icon></a></p>
    </ui-modal>
    
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
        v-if="!state.joining && !state.launching"
        :metadata="crossword.meta"
        :shareLoading="shareLoading"
        :shareLink="shareLink"
        :shortLink="shortLink"
        :emojiText="emojiNotation"
        :sourceLoading="!state.initialised"
        class="hidden-print"
        :state="state"
        :recentCrosswords="recentCrosswords"
        :showInstall="installPrompt || (iOSSafari && !standalone)"
        @install-clicked="installClicked()"
        @share-clicked="shareClicked($event)"
        @copy-clicked="copyClicked($event)"
        @logo-clicked="openLauncher()"
        @go-offline-clicked='goOffline()'
        @download-puz-clicked="downloadPuzClicked()"
        @download-eno-clicked="downloadEnoClicked()"
        @open-recent-clicked="openById($event)"
        @emoji-button-clicked="updateEmoji()"
        @copy-emoji-clicked="copyEmojiClicked()"
        @import-emoji-clicked="importEmojiClicked($event)"
        @export-eno-clicked="exportLinkClicked(getEnoParams(true))"
        @puz-file-uploaded="puzFileUploaded($event)"
        @emoji-file-uploaded="emojiFileUploaded($event)"
        @eno-file-uploaded="enoFileUploaded($event)"
        @shorten-link-clicked="shortenLinkClicked($event)"
        @clear-short-link="clearShortLink()"
    >
    </cfz-header-toolbar>
    
    <div id="app-content" ref="appContent" :data-portrait="isPortrait" :data-show-grid="showGrid"
         v-if="!state.launching"
         @dragenter="dragEnterHandler"
         @dragover="dragOverHandler"
         @dragleave="dragLeaveHandler"
         @drop="dropHandler">
        <div id="drop-area" ref="dropArea">
            <h1>Drop here to solve</h1>
        </div>
        <template v-if="state.joining || state.downloading">
            <ui-modal v-if="state.joining" ref="joinModal" @reveal="onJoinReveal()" :title="!joinFailed ? 'Join and solve' : 'Session not found'" :dismissible="state.joiningFromLauncher" @close="launcherJoinClosed()">
                <div v-if="!joinFailed && !shouldJoin()" style="text-align: center;">
                    <p class="join-info-text">Join a crossword using a session identifier.</p>
                    <ui-textbox ref="sessionIdBox" class="crossword-join-input crossword-sess-id-input" v-model="sessionIdText" @keydown-enter="joinClicked()" autocomplete="off">
                            Session ID (x-y-z)
                    </ui-textbox> 
                </div>
                <div v-if="!joinFailed" style="text-align: center;">
                    <p class="join-info-text">Choose your name to join and solve this crossword with others in real time.</p>
                    <ui-textbox ref="nameBox" class="crossword-join-input crossword-name-input" v-model="solverName" @keydown-enter="joinClicked()">
                            <b>0A</b> Your name ({{solverName ? solverName.length : 0}})
                    </ui-textbox> 
                    <ui-button :loading="joinLoading" color="primary" :disabled="joinDisabled()" @click="joinClicked()">Join</ui-button>
                </div>
                <div v-else style="text-align: center;">
                  <p class="join-info-text">
                    Sessions only stay active whilst there is at least one solver connected.
                    If you received an invitation from someone, please ask them to
                    start another session.
                  </p>
                  <ui-button color="primary" @click="dismissJoinError()">Dismiss</ui-button>
                </div>
            </ui-modal>
            <ui-modal ref="downloadModal" v-else> 
                <div style="text-align: center;">
                    <p class="join-info-text">
                        Downloading crossword...
                    </p>
                </div>
            </ui-modal>
        </template>
        <template v-if="!state.joining && state.initialised">
            <transition name="grid">
                <cfz-crossword-grid id="grid"
                    ref="grid"
                    key="gridContainer"
                    v-model="crossword"
                    :answerSlots.sync="answerSlots"
                    :workingLetters.sync="workingLetters"
                    :usingPencil="usingPencil"
                    :data-portrait="isPortrait"
                    :solverid="solverid"
                    :gridSize="gridSize"
                    :isPortrait="isPortrait"
                    :showTooltips="showTooltips"
                    :showScratchpad="showScratchpad"
                    @fill-cell="sendFillCell($event)"
                    v-if="showGrid">
                </cfz-crossword-grid>
            </transition>

            <transition name="compiling" mode="out-in">
                <cfz-crossword-editor id="editor"
                    ref="editor"
                    key="editor"
                    v-if="state.compiling"
                    v-model="editorSource"
                    @input="crosswordEdited($event)"
                    :loading="renderLoading"
                    :errorText="errorText"
                    :errorMessage="errorMessage"
                    :scrambled='!crossword.meta.scramble ? false : crossword.meta.scramble != "none"'
                    @preview-clicked="previewClicked()"
                    @scramble-clicked="scrambleClicked()"
                    @unscramble-clicked="unscrambleClicked()"
                    :data-show-grid="showGrid"
                    v-responsive.class>
                </cfz-crossword-editor>
                <div v-else id="clue-container" key="clueContainer" :data-portrait="isPortrait" :data-show-grid="showGrid">
                    <cfz-control-toolbar
                     v-on="$listeners"
                     v-model="usingPencil"
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
                        :usingPencil="usingPencil"
                        v-model="crossword" 
                        @fill-cell="sendFillCell($event)"
                        v-responsive.class
                        >
                    </cfz-crossword-clues>
                </div>
            </transition>
        </template>
        <template v-else>
            <ui-progress-circular class="grid-loader"></ui-progress-circular>
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
    margin: 0px;
/*  
    @media print {
        padding: 1.5cm !important;
    }
*/
}

.grid-loader {
    margin: auto;
}

.grid-enter-active,
.grid-leave-active {
  transition: all 0.5s;
}

.grid-enter:not([data-portrait]), .grid-leave-to:not([data-portrait]) {
    margin-left: -100vw;
    width: 100vw;
    opacity: 0;
}

.grid-enter[data-portrait], .grid-leave-to[data-portrait] {
    margin-top: -100vw;
    height: 100vw;
    opacity: 0;
}

.launcher-enter-active,
.launcher-leave-active {
  transition: all 0.5s;
}

.launcher-enter, .launcher-leave-to {
  opacity: 0;
}

.compiling-enter-active,
.compiling-leave-active {
  transition: all 0.5s;
}

.compiling-enter, .compiling-leave-to {
    opacity: 0;
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
    bottom: #{2 * $displayPadding};
}
.tippy-popper {
    font-family: $clueFontFamily;
}

.crossword-join-input {
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

.crossword-name-input {
    width: 10em;
}

.crossword-sess-id-input {
    width: 20em;
}


.join-info-text {
    text-align: left;
    padding-left: 1em;
    line-height: 1.5;
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
}

#app-content {
    display: flex;
    flex: 1 1 50%;
    &[data-portrait] {
        flex-direction: column;
    }
    width: 100%;
    height: calc(100% - 3.5rem);
    &[data-show-grid]:not([data-portrait]) {
        padding-bottom: $displayPadding;
    }
    @media print {
        display: block !important;
    }
}

#control-toolbar {
    position: sticky;
    top: 0;
}

#editor {
    overflow-x: scroll;
    width: 100%;
    margin-right: $displayPadding;
    border: 1px solid #000;
    min-height: 0;
    margin-top: $displayPadding;
    max-height: calc(100% - #{$displayPadding});
}

#drop-area {
    position: absolute;
    width: 100%;
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
}

#clue-container {
    flex: 1 1 50%;
    min-height: 0;
    overflow-y: hidden;

    @media screen  {
        &[data-show-grid]:not([data-portrait]) {
            border: 1px solid #000;
        }
        border-top: 1px solid #000;
    }

    &[data-show-grid]:not([data-portrait]) {
        margin-right: #{$displayPadding};
    }

    &[data-show-grid]:not([data-portrait]) {
        margin-top: #{$displayPadding};
        max-height: calc(100% - #{$displayPadding});
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
import CfzLauncher from './components/CfzLauncher.vue'
import CfzFileInput from './components/CfzFileInput.vue'

const parser = require('../@confuzzle/confuz-parser/parser');

const builder = require('../@confuzzle/confuz-parser/builder');

const confuz = require('../@confuzzle/confuz-crossword/confuz');

const ShareablePuz = require('@confuzzle/puz-sharing').ShareablePuz;

import copy from 'copy-to-clipboard';

import {EnoError} from 'enolib'

const {Manager} = require("socket.io-client");

import {emojisplosions} from "emojisplosion";

const gridlock = require('./js/gridlock');


const defaultCrossword = builder.parseAndBuild(gridlock.gridlockCrossword(), false);
export default Vue.extend({
  components: {
    CfzCrosswordClues,
    CfzCrosswordGrid,
    CfzCrosswordEditor,
    CfzHeaderToolbar,
    CfzControlToolbar,
    CfzDisconnectedModal,
    CfzLauncher,
    CfzFileInput
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
                launching: false,
                reconnecting: false
            };
        }
    },
    isPortrait: false,
    standalone: false,
    joinLoading: false,
    joinFailed: false,
    freezeHistory: false,
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
        default: gridlock.gridlockCrossword()
    },
    editorSource: "",
    client: Object
  },
  computed: {
    recentMetas() {
        const metas = [];
        for (const cwid of this.recentCrosswords) {
            const m = localStorage[cwid + ':meta'];
            if (m) {
                metas.push(JSON.parse(m));
            }
        }
        return metas;
    },
    shareLink() {
        return !this.gridid ? "" : this.shortUrl + '/' + this.gridid;
    },
    pageTitle() {
      if (this.firstLaunch)
        return 'Home | Confuzzle';
      if (this.joinFailed)
        return 'Session not found: ' + this.gridid + ' | Confuzzle';
      if (this.state.joining)
        return 'Join session' + (this.gridid ? ': ' + this.gridid : '') + ' | Confuzzle';
      return (this.state.colluding ? 'Group session: ' : '') + this.crossword.meta.fullName + ' | Confuzzle';
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
    statelessSource() {
      return this.crosswordSource.split(/\n#\s+state\n/)[0];
    },
    crosswordState() {
      return confuz.stateFromClues(this.crossword.clues);
    },
    crosswordId() {
      return this.crossword.meta.id;
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
    }
  },
  watch: {
    crosswordState(newValue, oldValue) {
      localStorage[this.crosswordId + ':state'] = newValue;
    },
    crosswordSource(newValue, oldValue) {
      if (!this.state.colluding && !this.state.joining && !this.freezeHistory) {
        this.updateHistory();
      }
      if (!this.state.compiling) {
        this.editorSource = this.crosswordSource;
      }
      this.lastId = this.crosswordId;
      this.renderCrossword();
      this.redrawEditor();
      this.updateTitle();
      if (!this.state.colluding && !this.state.joining) {
        this.updateLocalStorage();
      }
      this.workingLetters = {};
      this.answerSlots = {};
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
            if (localStorage[this.crosswordId + ':explosionsCancelled'])
                return;
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
    if (this.shouldJoin()) {
      this.startJoining();
    }
  },
  
  mounted() {
    window.addEventListener('popstate', this.handlePopState);
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
    // this.gridSizeLocked = true;


    if (localStorage.recentCrosswords) {
        const recent = JSON.parse(localStorage.recentCrosswords);
        if (recent.length > this.maxRecent)
            recent.splice(this.maxRecent, recent.length - this.maxRecent);
        this.recentCrosswords = recent;
    }


    if (this.shouldJoin()) {
      this.firstLaunch = false;
      this.state.launching = false;
      this.startJoining();
    } else {
      const params = new URLSearchParams(window.location.search);
      if (params.get('puz') && params.get('puz').startsWith('http')
         || params.get('source') && params.get('source').startsWith('http')) {
        this.state.downloading = true;
      }
      this.firstLaunch = !(localStorage.haveLaunched || localStorage.recentCrosswords || params.get('source') || params.get('puz'));
      this.state.launching = this.firstLaunch;
      this.initSource();
    }
  },
  data() {
    return {
      shortUrl: window.location.hostname == 'confuzzle.app' ? 'https://confuzzle.me' : window.location.origin,
      bundler: "Parcel",
      copyMessage: 'Link copied to clipboard',
      exportMessage: 'Crossword saved to clipboard',
      exportEmojiMessage: '🧩✨ ➡️ 📋 ✅',
      snackbarDuration: 3000,
      toolbarHeight: 64,
      windowWidth: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
      windowHeight: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight,
      gridSizeLocked: false,
      dragCount: 0,
      maxRecent: 5,
      recentCrosswords: [],
      solverid: 0,
      socketid: '',
      shortLink: '',
      showGrid: true,
      usingPencil: false,
      showTooltips: true,
      showScratchpad: false,
      toggleOptions: [{name: 'grid', label: 'grid'}, {name: 'tooltips', label: 'tooltips'}],
      iOSSafari: false,
      iOSPrompt: false,
      installPrompt: null,
      firstLaunch: true,
      editDebounce: null,
      launchOption: '',
      emojiNotation: '',
      lastId: '',
      sessionIdText: "",
      puzzleModalTitle: '',
      answerSlots: {
        type: Object,
        default: function () { return {} }
      },
      workingLetters: {
        type: Object,
        default: function () { return {} }
      }
    };
  },
  methods: {
    openPuzzleFromLauncher(mode) {
        this.puzzleModalTitle = this.getPuzzleModalTitle(mode);
        this.launchOption = mode;
        this.$refs.puzzleModal.open()
        // hack to hide tooltip on mobile
        this.$refs.appContainer.click()
    },
    getPuzzleModalTitle(mode) {
        if (mode == 'create') {
            return 'Open for editing';
        }
        if (mode == 'invite') {
            return 'Open for sharing';
        }
        return 'Open for solving';
    },
    shouldJoin() {
      var shouldJoin = false;
      if (window.location.pathname != "/") {
          const pathParts = window.location.pathname.split('/');
          if (pathParts.length > 1) {
              this.gridid = pathParts[1];
              shouldJoin = true;
          }
      }
      return shouldJoin;
    },
    startJoining() {
        this.state.joining = true;
        this.updateTitle();
        if (localStorage['confuzzle:solverName']) {
            this.solverName = localStorage['confuzzle:solverName'];
        }
        Vue.nextTick(() => {
            this.$refs.joinModal.open()
        })
    },
    updateHistory() {
      const sameCrossword = this.crosswordId == this.lastId;
      if (!this.lastId || sameCrossword || this.state.compiling || this.joinFailed) {
        this.replaceState();
      } else {
        this.pushState();
      }
      Vue.nextTick(() => {
        document.title = this.pageTitle
      });
    },
    setHaveLaunched() {
        localStorage.haveLaunched = '1';
        this.firstLaunch = false;
    },
    leaveSessionFromLauncher() {
        this.setHaveLaunched();
        this.state.launching = false;
        this.goOffline();
    },
    joinSessionFromLauncher() {
        this.setHaveLaunched();
        this.state.joiningFromLauncher = true;
        this.state.launching = false;
        this.gridid = this.sessionIdText.toLowerCase();
        this.startJoining();
    },
    launcherJoinClosed() {
        this.state.joiningFromLauncher = false;
        this.state.joining = false;
        this.state.launching = true;
        this.updateTitle();
    },
    openFromLauncher(cwid) {
        this.openById(cwid);
        this.returnFromLauncher();
    },
    openSampleFromLauncher(cwid) {
        this.setCrosswordSource(gridlock.gridlockCrossword());
        this.returnFromLauncher();
    },
    returnFromLauncher() {
        const mode = this.$refs.launcher.lastSelectedOption;
        this.$refs.puzzleModal.close();
        this.setHaveLaunched();
        if (mode == 'create' || mode == 'invite' || mode == 'solve') {
            this.goOffline();
        }
        if (mode == 'create') {
            this.startCompiling();
        }
        this.state.launching = false;
        this.updateTitle();
        if (mode == 'invite') {
            Vue.nextTick(() => {
                this.$refs.toolbar.openShareModal();
            });
        }
    },
    beforeInstall(e) {
        e.preventDefault();
        this.installPrompt = e;
    },
    iOSPromptClicked() {
        this.iOSPrompt = false;
    },
    getShareablePuz() {
        var eno = this.statelessSource + (this.state.compiling ? '' : this.crosswordState);
        return confuz.toPuz(eno);
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
    handlePopState() {
      this.gridid = '';
      if (this.state.colluding) {
        this.state.colluding = false;
        if (this.$options.socket) {
            this.$options.socket.close();
        }
        this.$options.socket = null;
        this.clearAllHighlighted();
        this.snackbarMessage('You left the session');
      }
      this.state.joiningFromLauncher = false;

      if (this.state.joining) {
        this.state.joining = false;
      }
      if (this.shouldJoin()) {
        this.startJoining();
      } else {
        this.freezeHistory = true;
        this.initSource();
        Vue.nextTick(() => {
          this.freezeHistory = false
        });
      }
      this.updateTitle();
    },
    // https://stackoverflow.com/a/11744120
    handleResize() {
        this.windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        this.windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        const w = this.windowWidth;
        const h = this.windowHeight;
        this.isPortrait = h > w;

        if (!this.gridSizeLocked) {
            if (this.isPortrait) {
                this.gridSize = (w < 0.67*h) ? w : 0.67*h;
            } else {
                this.gridSize = h - this.toolbarHeight;    
            }
        }
    },
    handleOrientationChange() {
        const w = this.windowWidth;
        const h = this.windowHeight;
        this.isPortrait = !(window.orientation == -90 || window.orientation == 90);
        if (!this.gridSizeLocked)
            this.gridSize = this.isPortrait ? w : (h - this.toolbarHeight);
    },
    onJoinReveal() {
        if (!this.shouldJoin()) {
            this.$refs.sessionIdBox.focus();
        } else {
            this.$refs.nameBox.focus();
        }
    },
    createSocket() {
        const self = this;
        this.$options.manager = new Manager(window.location.origin, {
            reconnectionAttempts: 5,
            autoConnect: false
        });
        this.$options.manager.on('error', (err) => {
            console.log(err);
            this.connectFailed();
        });
        this.$options.manager.on('reconnect_failed', (err) => {
            this.lostConnection();
        });

        this.$options.manager.open();
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

        this.$options.socket.open();

        this.handlers = {
            crosswordShared: 'shareSucceeded',
            fillCell: 'fillCell',
            selectionChanged: 'selectionChanged',
            gridJoined: 'gridJoined',
            noSuchGrid: 'connectFailed',
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
        localStorage[this.crosswordId + ':explosionsCancelled'] = '1';
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
            this.crossword = builder.parseAndBuild(this.crosswordSource, this.state.compiling);
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
        // this.gridSizeLocked = false;
        this.handleResize();
        // this.gridSizeLocked = true;
        this.renderLoading = false;
        this.showScratchpad = false;

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
    updateTitle() {
       document.title = this.pageTitle;
    },
    shortenLinkClicked(url) {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/shorten');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.addEventListener('load', event => {
          this.shortLink = 'https://grids.confuzzle.me/' + event.target.responseText;
        });
        xhr.addEventListener('error', event => {
          console.log(event.target.responseText);
        });
        xhr.send('uri=' + encodeURIComponent(url));
    },
    clearShortLink() {
        this.shortLink = '';
    },
    fetchPuz(url, gid) {
        this.state.downloading = true;
        fetch('/external?uri=' + url).then(res => { 
          res.arrayBuffer().then(puz => {
            this.state.downloading = false;
            let eno = confuz.fromPuz(ShareablePuz.from(Buffer.from(puz)));
            const cw = parser.parse(eno);
            if (localStorage[cw.meta.id + ':state']) {
                eno += localStorage[cw.meta.id + ':state'];
            }
            this.setCrosswordSource(eno, url, gid)
          })
        }).catch(error => {
          console.error('Error downloading puz:', error);
        });
    },
    fetchConfuz(url, gid) {
        this.state.downloading = true;
        fetch('/external?uri=' + url).then(res => { 
          res.text().then(eno => {
            this.state.downloading = false;
            const cw = parser.parse(eno);
            if (localStorage[cw.meta.id + ':state']) {
                eno += localStorage[cw.meta.id + ':state'];
            }
            this.setCrosswordSource(eno, url, gid);
          })
        }).catch(error => {
          console.error('Error downloading confuz:', error);
        });
    },
    initSource() {
      const params = new URLSearchParams(window.location.search);
      const enoSource = params.get('source');
      const puz = params.get('puz');
      const strippedPuz = params.get('🧩');
      const gid = params.get('gid');

      if (enoSource) {
          if (enoSource.startsWith('https://') || enoSource.startsWith('http://')) {
            this.fetchConfuz(enoSource, gid);
          } else {
              let eno = confuz.decompressURL(enoSource);
              const cw = parser.parse(eno);
              const enoState = params.get('state');
              if (enoState) {
                eno += confuz.decompressURL(enoState);
              } else if (localStorage[cw.meta.id + ':state']) {
                eno += localStorage[cw.meta.id + ':state'];
              }
              this.setCrosswordSource(eno);
          }
      } else if (puz) {
        if (puz.startsWith('https://') || puz.startsWith('http://')) {
            this.fetchPuz(puz, gid);
        } else {
            this.setCrosswordSource(confuz.fromPuz(ShareablePuz.fromURL(puz)));
        }
      } else if (strippedPuz) {
          this.setCrosswordSource(confuz.fromPuz(ShareablePuz.fromEmoji(strippedPuz, true)));
      } else if (localStorage.crosswordId) {
        let cwid = localStorage.crosswordId; 
        let eno = localStorage[cwid + ':source'];
        if (eno) {
          const cw = parser.parse(eno);
          if (localStorage[cw.meta.id + ':state']) {
            eno += localStorage[cw.meta.id + ':state'];
          }
          this.setCrosswordSource(eno);
        }
      }
    },
    updateLocalStorage() {
      localStorage[this.crosswordId + ':source'] = this.statelessSource;
      localStorage[this.crosswordId + ':meta'] = JSON.stringify(this.crossword.meta);
      localStorage[this.crosswordId + ':explosionsCancelled'] = '';
      localStorage.crosswordId = this.crosswordId;
      let recent = [];
      if (localStorage.recentCrosswords) {
        recent = JSON.parse(localStorage.recentCrosswords);
        for (let i = 0; i < recent.length; i++) {
          if (recent[i] == this.crosswordId) {
            recent.splice(i, 1);
            break;
          }
        }
      }
      recent.splice(0, 0, this.crosswordId);
      this.recentCrosswords = recent.slice(0, this.maxRecent);
      localStorage.recentCrosswords = JSON.stringify(recent);
    },
    crosswordEdited(source) {
        this.renderLoading = true;
        if (this.editDebounce) {
            clearTimeout(this.editDebounce);
        }
        this.editDebounce = setTimeout(
           () => {
                this.renderLoading = false;
                this.crosswordSource = source;
                this.editDebounce = null;
           },
           1000
        );
    },
    startCompiling() {
        this.editorSource = JSON.parse(JSON.stringify(this.crosswordSource));
        this.state.compiling = true;
    },
    endCompiling() {
        this.state.compiling = false;
    },
    previewClicked() {
        this.endCompiling();
    },
    editSourceClicked() {
        this.startCompiling();
    },
    redrawEditor() {
        Vue.nextTick(() => this.$refs.editor && this.$refs.editor.redraw());
    },
    scrambleClicked() {
        this.setCrosswordSource(confuz.fromCrossword(this.crossword, {scramble: true}));
    },
    unscrambleClicked() {
        this.setCrosswordSource(confuz.fromCrossword(this.crossword, {scramble: false}));
    },
    connectFailed() {
      this.joinLoading = false;
      this.joinFailed = true;
      this.updateTitle();
    },
    dismissJoinError() {
      this.joinLoading = false;
      this.joinFailed = false;
      this.state.joining = false;
      
      if (!this.state.joiningFromLauncher)
        this.firstLaunch = true;

      this.state.joiningFromLauncher = false;

      this.goOffline();
      window.history.replaceState(null, '', '/');
      
      this.updateTitle()
      this.openLauncher();
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
                cell.special = '-';
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
                    cell.special = '-';
                    this.setCheated();
                    this.sendFillCell({
                        clueid: clue.id,
                        offset: i,
                        value: cell.solution,
                        special: cell.special
                    });
                }
            }
            clue.showIncorrect = false;
            clue.showCorrect = false;
            clue = clue.nextRef;
        }
    },
    setCheated() {
        localStorage[this.crosswordId + ':cheated'] = '1'
    },
    getCheated() {
        return localStorage[this.crosswordId + ':cheated'];
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
            this.snackbarMessage(msg.joined.name + ' joined the session');
        } else if (msg.disconnected) {
            for (let [clueid, clue] of Object.entries(this.crossword.clues)) {
                clue.clearHighlight(msg.disconnected.solverid);
            }
            this.snackbarMessage(msg.disconnected.name + ' left the session');
        }
    },
    fillCell(msg) {
        this.crossword.clues[msg.clueid].showIncorrect = false;
        this.crossword.clues[msg.clueid].showCorrect = false;
        this.crossword.clues[msg.clueid].cells[msg.offset].contents = msg.value;
        this.crossword.clues[msg.clueid].cells[msg.offset].special = msg.special;
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
            value: event.value,
            special: event.special
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

        this.setCrosswordSource(msg.crossword.source + (msg.crossword.state ? msg.crossword.state : ''));
        Vue.nextTick(() => {
            this.replayEvents(msg.events);    
        });

        this.state.joining = false;
        this.state.joiningFromLauncher = false;

        this.joinLoading = false;
        this.state.colluding = true;
        this.endCompiling();

        if (this.state.reconnecting) {
            this.$refs.disconnectedModal.close();
            this.reconnectFailed = false;
            this.state.reconnecting = false;
        } 
        this.updateTitle();
        this.snackbarMessage('You joined the session')
    },
    joinDisabled() {
        return !this.solverName || !(this.shouldJoin() || this.sessionIdText);
    },
    browseClicked() {
        this.$refs.fileInput.openFile();
    },
    joinClicked() {
        if (this.joinDisabled())
            return;
        if (this.solverName)
            localStorage['confuzzle:solverName'] = this.solverName;
        if (this.sessionIdText) {
            this.gridid = this.sessionIdText.toLowerCase();
        }
        this.joinLoading = true;
        this.createSocket();
    },
    shareClicked(name) {
        const self = this;
        if (this.state.compiling) {
            this.endCompiling();
            this.renderCrossword();
        }
        this.createSocket();
        this.solverName = name;
        this.shareLoading = true;
        this.$options.socket.emit('shareCrossword', {
            crossword: {
                source: this.statelessSource,
                state: this.crosswordState
            },
            name: name
        });
    },
    shareSucceeded(msg) {
        this.gridid = msg.gridid;
        this.solvers = msg.solvers;
        window.history.pushState(null, '', '/' + msg.gridid);
        this.state.colluding = true;
        this.shareLoading = false;
        this.updateTitle();
    },
    goOffline() {
        this.gridid = '';
        if (!this.state.colluding)
            return;
        this.state.colluding = false;
        this.updateTitle();
        if (this.$options.socket) {
            this.$options.socket.close();
        }
        this.$options.socket = null;
        this.$refs.disconnectedModal.close();
        this.clearAllHighlighted();
        this.snackbarMessage('You left the session');
        this.pushState();
    },
    reconnectClicked(event) {
        this.state.reconnecting = true;
        this.createSocket();
        this.joinClicked();
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
        if (file.name.endsWith('.eno') || file.name.endsWith('.confuz') || file.name.endsWith('.txt')) {
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
    
    openById(cwid) {
      let eno = localStorage[cwid + ':source'];
      if (eno) {
        const cw = parser.parse(eno);
        if (localStorage[cw.meta.id + ':state']) {
          eno += localStorage[cw.meta.id + ':state'];
        }
        this.setCrosswordSource(eno);
      }
    },
    inviteEno(buf) {
        this.setHaveLaunched();
        this.goOffline();
        this.enoFileUploaded(buf);
        this.state.launching = false;
        Vue.nextTick(() => {
            this.$refs.toolbar.openShareModal();
        });
    },
    invitePuz(buf) {
        this.setHaveLaunched();
        this.goOffline();
        this.puzFileUploaded(buf);
        this.state.launching = false;
        Vue.nextTick(() => {
            this.$refs.toolbar.openShareModal();
        });
    },
    enoFileUploaded(buf) {
        this.setCrosswordSource(Buffer.from(buf).toString('utf8'));
    },
    emojiFileUploaded(buf) {
        const emoji = Buffer.from(buf).toString('utf8');
        this.setCrosswordSource(confuz.fromPuz(ShareablePuz.fromEmoji(emoji, true)));
    },
    puzFileUploaded(buf) {
        this.setCrosswordSource(confuz.fromPuz(ShareablePuz.from(new Uint8Array(buf))));
    },
    pushState() {
        window.history.pushState(null, '', '/' + this.getEnoParams());
    },
    replaceState() {
        window.history.replaceState(null, '', '/' + this.getEnoParams());
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
            this.exportLinkClicked(this.getEnoParams(true))
        }
    },
   
    downloadPuzClicked() {
        const blob = new Blob([this.getShareablePuz().toBytes(false)], {type: "application/octet-stream"});
        this.downloadCrossword(blob, '.puz');
    },
    downloadEnoClicked() {
        var eno = this.statelessSource;
        if (!this.state.compiling) {
            eno += this.crosswordState;
        }
        const blob = new Blob([eno], {type: "text/plain"});
        this.downloadCrossword(blob, '.confuz.txt')
    },
    downloadCrossword(blob, extension) {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        const basename = this.crossword.meta.fullName;
        const filename = basename + extension;
        link.download = filename;
        link.click();
    },
    openLauncher() {
      this.state.launching = true;
    },
    copyClicked() {
        this.snackbarMessage(this.copyMessage);
    },
    getEnoParams(stateful) {
        var params = '?source=' + confuz.compressURL(this.statelessSource);
        if (stateful) {
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
        copy(this.emojiNotation);
        this.snackbarMessage(this.exportEmojiMessage);
    },
    setCrosswordSource(source, url, gid) {
        // inject URL into meta section of source
        if (url) {
            const parts = source.split(/^#\s+meta\s*\n/);
            if (parts && parts.length) {
                let extra = 'url: ' + url + '\n';
                if (gid) {
                    extra += 'gid: ' + gid + '\n';
                }
                parts[parts.length - 1] = extra + parts[parts.length - 1];
            }
            source = parts.join('# meta\n')
        }
        this.crosswordSource = source;
        this.crosswordURL = url;
        this.editorSource = source;
        this.state.initialised = true;
    },
    importEmojiClicked(emoji) {
        this.setCrosswordSource(confuz.fromPuz(ShareablePuz.fromEmoji(emoji, true)));
    },
    exportLinkClicked(params) {
        const link = window.location.origin.replace(/\/$/, "") + params;
        copy(link);
        this.snackbarMessage(this.exportMessage);
    }
  }
});
</script>