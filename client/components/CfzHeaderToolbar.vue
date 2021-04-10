<template>
<ui-toolbar type="colored" class="crossword-toolbar" :loading="sourceLoading" style="overflow: hidden;" removeNavIcon>
    <table slot="brand" width="40">
        <td data-solver-mask="3" data-number="?" style="height: 1em; width: 1em; z-index: 0 !important;"
         @click="$emit('logo-clicked')">C</td>
    </table>
    <template v-slot="title">
        <div v-if="!sourceLoading" class="crossword-title">
            <span class="crossword-meta-name" v-responsive.class>{{metadata.name}}</span>
            <span class="crossword-meta-author" v-responsive.class>by {{metadata.author}}</span>
            <span class="crossword-meta-identifier" v-if="metadata.identifier" v-responsive.md.lg.xl>{{metadata.identifier}}</span>
        </div>
        <div v-else class="crossword-loading-text">Loading...</div>
    </template>
    <div v-if="!sourceLoading" slot="actions" class="hidden-print crossword-toolbar-actions">
        <ui-icon-button
            color="white"
            icon="print"
            size="large"
            @click="printClicked()"
            v-responsive.md.lg.xl
        >
        </ui-icon-button>
        <ui-icon-button
            :color="state.colluding ? 'green' : 'white'"
            type="secondary"
            icon="group_add"
            size="large"
            @click="openModal('shareModal')"
            v-if="isOnline"
        >
        </ui-icon-button>
        <cfz-share-modal
            ref="shareModal"
            :title="metadata.name"
            :loading="shareLoading"
            :link="shareLink"
            v-on="$listeners">
        </cfz-share-modal>
        <cfz-file-input ref="fileInput" v-on="$listeners"></cfz-file-input>
        <ui-icon-button
            color="white"
            has-dropdown
            icon="more_vert"
            ref="menuDropdown"
            dropdownPosition="left bottom"
            size="large"
        >
            <ui-menu
                contain-focus
                has-icons
                class="cfz-menu"
                position="bottom-end"
                slot="dropdown"
                :options="mobileMenuOptions"
                @select="selectMenuOption($event)"
                @close="$refs.menuDropdown.closeDropdown()"
                v-responsive.xs.sm
            ></ui-menu>
            <ui-menu
                contain-focus
                has-icons
                class="cfz-menu"
                slot="dropdown"
                :options="menuOptions"
                @select="selectMenuOption($event)"
                @close="$refs.menuDropdown.closeDropdown()"
                v-responsive.md.lg.xl
            ></ui-menu>
        </ui-icon-button>
        <ui-modal ref="recentModal" title="Recent crosswords">
            <ul>
                <li is="ui-button" raised @click="openRecentClicked(m.id)" class="file-tile" v-for="m in recentMetas">
                    <div class="file-tile-text">
                        <span class="file-tile-name">{{m.name}}</span>
                        <span class="file-tile-author">{{m.author}}</span>
                    </div>
                </li>
            </ul>
        </ui-modal>
        <ui-modal ref="linkModal" title="Link external crossword" @hide="linkModalHidden()">
            <div style="text-align: center;">
                <template v-if="!shortLink">
                    <div>
                        <p class="about-text">
                            Generate a short link for solving an externally-hosted crossword.
                        </p>
                        <ui-textbox class="crossword-join-input crossword-sess-id-input" v-model="externalLink" @keydown-enter="shortenLinkClicked()" autocomplete="off" :invalid="externalLink.length > 0 && linkInvalid" error="Invalid URL">
                                URL of .puz or .confuz
                        </ui-textbox> 
                        <p class="about-text">
                            Only this URL will be stored on Confuzzle servers, not the crossword itself.
                        </p>
                        <ui-button color="primary" style="margin-top: 1em;" :loading="creatingLink" @click="shortenLinkClicked()" :disabled="linkInvalid">Submit</ui-button>
                    </div>
                </template>
                <template v-else>
                    <p class="about-text">Access your externally-hosted crossword using the following link. It's only displayed once, so be sure to save it somewhere.</p>
                    <div class="crossword-link-text">{{shortLink}}</div>
                    <ui-button color="primary" style="margin-top: 1em;" @click="copyClicked()">Copy</ui-button>
                    <p class="about-text">Embed your crossword in another website with the following snippet</p>
                    <div class="crossword-link-text"><pre><code ref="codeDiv" class="language-html"></code></pre></div>
                </template>
            </div>
        </ui-modal>
        <ui-modal ref="aboutModal" title="About">
            <div style="text-align: center;">
                <p class="about-text">
                    This is a hobby project by <a href="https://rjk.at">Rowan</a>. Source code is available <a href="https://github.com/rjkat/confuzzle">on github</a> (MIT license).
                </p>
                <form action="https://www.buymeacoffee.com/rjkat" target="_blank" rel="noopener">
                    <ui-button color="primary" style="margin-top: 1em;" icon="open_in_new">Buy me a coffee</ui-button>
                </form>
                <ui-button class="emoji-button" @click="emojiButtonClicked()">🧩✨</ui-button>
            </div>
        </ui-modal>
        <ui-modal ref="emojiModal" title="🧩✨ 🔄 📋">
            <div style="text-align: center;">
                <ui-textbox :value="emojiText" readonly></ui-textbox>
                <ui-icon-button id="copy-emoji-button" icon="content_copy" @click="copyEmojiClicked()"></ui-icon-button>
                <ui-textbox
                    v-model="inputEmoji"
                    floating-label
                    label="📋 ➡️ 🧩✨"
                    style="margin-top: 1em;"></ui-textbox>
                <ui-icon-button id="import-emoji-button" icon="forward" @click="importEmojiClicked()"></ui-icon-button>
            </div>
        </ui-modal>
    </div>
</ui-toolbar>
</template>

<style lang="scss">

.emoji-button {
    background: transparent !important;
    font-size: 20px;
}

.about-text {
    font-family: $clueFontFamily;
}


.ui-toolbar__brand {
    min-width: 0;
}

.ui-toolbar__body.has-brand-divider {
    border: none;
}

.ui-toolbar--type-colored {
    background-color: $titleBgColor !important;

    .ui-toolbar__body {
        color: white !important;
    }
}

ul {
  list-style: none;
  padding: 0;
}

.file-tile {
  cursor: pointer !important;
  margin-right: auto;
  margin-left: auto;
  margin-top: 8px;
  min-width: 0 !important;
  padding-left: 4px !important;
  padding-right: 4px !important;
  height: 20px;
  display: block;
}

.file-tile-text {
    max-height: 1em;
}

.file-tile-author {
  margin-left: 6px;
  color: #888;
  font-family: $clueFontFamily;
  text-transform: none;
  font-size: 13px;

  
}

.crossword-title {
    margin-top: .25em;
    margin-bottom: .25em;
}

.crossword-loading-text {
    text-transform: uppercase;
    font-family: $titleFontFamily;
    font-weight: bold;
}

.crossword-meta-name {
    text-transform: uppercase;
    font-family: $titleFontFamily;
    font-weight: bold;
    padding-right: .5em;
    &.bs4-sm, &.bs4-xs {
        font-size: 14px;
    }
}

.ui-textbox__feedback-text {
    font-family: $clueFontFamily; 
}

.crossword-meta-author {
    font-family: $clueFontFamily; 
    font-size: 16px;
    padding-right: .5em;
    &.bs4-sm, &.bs4-xs {
        font-size: 14px;
    }
}

.crossword-meta-identifier {
    font-family: $titleFontFamily;
    margin-right: .5em;
}

</style>

<script>
import Vue from "vue";

import {emojisplosion} from "emojisplosion";
import CfzShareModal from './CfzShareModal.vue'
import CfzFileInput from './CfzFileInput.vue'

import copy from 'copy-to-clipboard';

// https://gist.github.com/hanayashiki/8dac237671343e7f0b15de617b0051bd
(function () {
  if ('File' in self)
    File.prototype.arrayBuffer = File.prototype.arrayBuffer || myArrayBuffer;
  Blob.prototype.arrayBuffer = Blob.prototype.arrayBuffer || myArrayBuffer;

  function myArrayBuffer() {
    // this: File or Blob
    return new Promise((resolve) => {
      let fr = new FileReader();
      fr.onload = () => {
        resolve(fr.result);
      };
      fr.readAsArrayBuffer(this);
    })
  }
})();

// https://stackoverflow.com/questions/1480133
var cumulativeOffset = function(element) {
    var top = 0, left = 0;
    do {
        top += element.offsetTop  || 0;
        left += element.offsetLeft || 0;
        element = element.offsetParent;
    } while(element);

    return {
        top: top,
        left: left
    };
};

function explodeOn(id) {
    const element = document.getElementById(id);
    emojisplosion({
        position() {
            const offset = cumulativeOffset(element);
            return {
              x: offset.left + element.clientWidth / 2,
              y: offset.top + element.clientHeight / 2,
            };
        },
    })
}


// https://stackoverflow.com/a/22648406
function isURL(str) {
     var urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
     var url = new RegExp(urlRegex, 'i');
     return str.length < 2083 && url.test(str);
}

export default Vue.extend({
  components: {
    CfzShareModal,
    CfzFileInput
  },
  props: {
    metadata: Object,
    state: Object,
    recentCrosswords: Array,
    shareLoading: false,
    shareLink: "",
    shortLink: "",
    sourceLoading: false,
    showInstall: false,
    emojiText: ""
  },
  computed: {
    embedCode() {
       return '<iframe src="' + this.shortLink + '"\n        height="550" width="800" frameBorder="0">\n</iframe>';
    },
    linkInvalid() {
        return !isURL(this.externalLink);
    },
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
    menuOptions() {
        var options = [];
        if (this.showInstall)
            options.push(this.opt.INSTALL);

        if (this.state.colluding) {
            options.push(this.opt.SOLVE_OFFLINE);
        } else {
            options.push(this.opt.OPEN_PUZZLE);

            if (this.recentMetas.length > 0)
                options.push(this.opt.OPEN_RECENT);
        }

        options.push(this.opt.SAVE_PUZ);
        options.push(this.opt.SAVE_ENO);
        options.push(this.opt.LINK_EXTERNAL);
        options.push(this.opt.ABOUT);

        return options;
    },
    mobileMenuOptions() {
        return this.menuOptions;
    }
  },
  watch: {
    shortLink() {
        Vue.nextTick(() => {
            this.$refs.codeDiv.textContent = this.embedCode;
            Prism.highlightElement(this.$refs.codeDiv);
        });
    }
  },
  methods: {
    openModal(ref) {
        this.$refs[ref].open();
    },
    openShareModal() {
        this.openModal('shareModal');
    },
    closeModal(ref) {
        this.$refs[ref].close();
    },
    openPuzzle() {
        this.$refs.fileInput.openFile();
    },
    emojiButtonClicked() {
        this.$emit('emoji-button-clicked');
        this.openModal('emojiModal');
        this.closeModal('aboutModal');
    },
    copyClicked() {
        copy(this.shortLink);
        this.$emit('copy-clicked');
    },
    makeNewLinkClicked() {
        this.$emit('make-new-link-clicked');
    },
    copyEmojiClicked() {
        explodeOn('copy-emoji-button');
        this.$emit('copy-emoji-clicked');
    },
    importEmojiClicked() {
        if (!this.inputEmoji)
            return;
        explodeOn('import-emoji-button');
        this.$emit('import-emoji-clicked', this.inputEmoji);
        this.closeModal('emojiModal');
    },
    printClicked() {
        this.state.printing = true;
        this.state.compiling = false;
        Vue.nextTick(() => window.print());
    },
    openRecentClicked(id) {
        this.$emit('open-recent-clicked', id);
        this.closeModal('recentModal');
    },
    shortenLinkClicked() {
        if (this.linkInvalid)
            return;
        this.creatingLink = true;
        this.$emit('shorten-link-clicked', this.externalLink);
    },
    linkModalHidden() {
        this.creatingLink = false;
        this.$emit('clear-short-link');
    },
    selectMenuOption(option) {
        if (option.label == this.opt.SAVE_PUZ.label) {
            this.$emit('download-puz-clicked');
        } else if (option.label == this.opt.SAVE_ENO.label) {
            this.$emit('download-eno-clicked');
        } else if (option.label == this.opt.SOLVE_OFFLINE.label) {
            this.$emit('go-offline-clicked');
        } else if (option.label == this.opt.OPEN_PUZZLE.label) {
            this.openPuzzle();
        } else if (option.label == this.opt.OPEN_RECENT.label) {
            this.openModal('recentModal');
         } else if (option.label == this.opt.LINK_EXTERNAL.label) {
            this.openModal('linkModal');
        } else if (option.label == this.opt.ABOUT.label) {
            this.openModal('aboutModal');
        } else if (option.label == this.opt.INSTALL.label) {
            this.$emit('install-clicked');
        }
    },
  },
  mounted() {
    this.isOnline = window.navigator.onLine;
    window.addEventListener('online', () => {
        this.isOnline = true;
    });
    window.addEventListener('offline', () => {
        this.isOnline = false;
    });
  },
  data() {
    return {
      bundler: "Parcel",
      isOnline: true,
      creatingLink: false,
      inputEmoji: "",
      externalLink: "",
      opt: {
        INSTALL: {
            label: 'Install app',
            icon: 'add_circle_outline'
        },
        OPEN_PUZZLE: {
            label: 'Load file...',
            icon: 'folder_open'
        },
        OPEN_RECENT: {
            label: 'Open recent...',
            icon: 'history'
        },
        SAVE_PUZ: {
            label: 'Save as .puz',
            icon: 'get_app'
        },
        SAVE_ENO: {
            label: 'Save as .confuz',
            icon: 'get_app'
        },
        LINK_EXTERNAL: {
            label: 'Generate link...',
            icon: 'link'
        },
        SOLVE_OFFLINE: {
            label: 'Leave session',
            icon: 'no_meeting_room'
        },
        ABOUT: {
            label: 'About',
            icon: 'info'
        }
      }
    };
  }
});
</script>

