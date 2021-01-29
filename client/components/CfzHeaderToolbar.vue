<template>
<ui-toolbar type="colored" removeNavIcon>
    <template v-slot="title">
        <span style="{display: inline-flex; align-items: center;}">
            <span class="crossword-meta-name">{{metadata.name}}</span>
            <span class="crossword-meta-author">by {{metadata.author}}</span>
            <span class="crossword-meta-identifier" v-if="metadata.identifier" v-responsive.md.lg.xl>{{metadata.identifier}}</span>
        </span>
    </template>
    <div slot="actions" class="hidden-print">
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

        <input type="file" ref="fileInput"
            accept=".puz,.eno,.confuz,.🧩✨"
            @change="handleFiles()"
            style="display: none">
        </input>
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
        <ui-modal ref="aboutModal" title="About">
            <div style="text-align: center;">
                <p class="about-text">
                    This is a hobby project by <a href="https://rjk.at">Rowan</a>. Source code is available <a href="https://github.com/rjkat/confuzzle">on github</a> (MIT license).
                </p>
                <form action="https://www.buymeacoffee.com/rjkat" target="_blank">
                    <ui-button color="primary" style="margin-top: 1em;">Buy me a coffee</ui-button>
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

.ui-toolbar--type-colored {
    background-color: $titleBgColor !important;

    .ui-toolbar__body {
        color: white !important;
    }
}

.crossword-meta-name {
    text-transform: uppercase;
    font-family: $titleFontFamily;
    font-weight: bold;
}
.crossword-meta-author {
    font-family: $clueFontFamily; 
    margin-left: .5em;
    margin-right: .5em;
    font-size: 16px;
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

export default Vue.extend({
  components: {
    CfzShareModal
  },
  props: {
    metadata: Object,
    state: Object,
    shareLoading: false,
    shareLink: "",
    showInstall: false,
    emojiText: ""
  },
  computed: {
    menuOptions() {
        var options = [];
        if (this.showInstall)
            options.push(this.opt.INSTALL);

        if (this.state.colluding) {
            options.push(this.opt.SOLVE_OFFLINE);
        } else {
            options.push(this.opt.OPEN_PUZZLE);
        }

        options.push(this.opt.SAVE_PUZ);
        options.push(this.opt.SAVE_ENO);
        options.push(this.opt.EXPORT_ENO_LINK);
        options.push(this.opt.ABOUT);

        return options;
    },
    mobileMenuOptions() {
        return this.menuOptions;
    }
  },
  methods: {
    openModal(ref) {
        this.$refs[ref].open();
    },
    closeModal(ref) {
        this.$refs[ref].close();
    },
    openPuzzle() {
        this.$refs.fileInput.click();
    },
    handleFiles() {
        const self = this;
        let files = this.$refs.fileInput.files;
        const file = files[0];
        if (file.name.endsWith('.eno') || file.name.endsWith('.confuz')) {
            file.arrayBuffer().then(
                buffer => self.$emit('eno-file-uploaded', buffer)
            )
        } else if (file.name.endsWith('.🧩')) {
            file.arrayBuffer().then(
                buffer => self.$emit('emoji-file-uploaded', buffer)
            )
        } else {
            file.arrayBuffer().then(
                buffer => self.$emit('puz-file-uploaded', buffer)
            )
        }
    },
    emojiButtonClicked() {
        this.$emit('emoji-button-clicked');
        this.openModal('emojiModal');
        this.closeModal('aboutModal');
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
    selectMenuOption(option) {
        if (option.label == this.opt.SAVE_PUZ.label) {
            this.$emit('download-puz-clicked');
        } else if (option.label == this.opt.SAVE_ENO.label) {
            this.$emit('download-eno-clicked');
        } else if (option.label == this.opt.EXPORT_ENO_LINK.label) {
            this.$emit('export-eno-clicked');
        } else if (option.label == this.opt.SOLVE_OFFLINE.label) {
            this.$emit('go-offline-clicked');
        } else if (option.label == this.opt.OPEN_PUZZLE.label) {
            this.openPuzzle();
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
      inputEmoji: "",
      opt: {
        INSTALL: {
            label: 'Install app',
            icon: 'add_circle_outline'
        },
        OPEN_PUZZLE: {
            label: 'Open puzzle...',
            icon: 'folder_open'
        },
        SAVE_PUZ: {
            label: 'Save as .puz',
            icon: 'get_app'
        },
        SAVE_ENO: {
            label: 'Save as .confuz',
            icon: 'get_app'
        },
        EXPORT_ENO_LINK: {
            label: 'Export to URL',
            icon: 'content_copy'
        },
        SOLVE_OFFLINE: {
            label: 'Leave session',
            icon: 'exit_to_app'
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

