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
            has-dropdown
            icon="print"
            size="large"
            @click="printClicked()"
            v-responsive.md.lg.xl
        >
        </ui-icon-button>
        <ui-icon-button
            :color="state.colluding ? 'green' : 'white'"
            type="secondary"
            has-dropdown
            :icon="state.colluding ? 'group_add' : 'share'"
            size="large"
            @click="openModal('shareModal')"
        >
        </ui-icon-button>
        <ana-share-modal
            ref="shareModal"
            :loading="shareLoading"
            :link="shareLink"
            v-on="$listeners">
        </ana-share-modal>

        <input type="file" ref="fileInput"
            accept=".puz,.eno"
            @change="handleFiles()"
            style="display: none">
        </input>
        <ui-icon-button
            color="white"
            has-dropdown
            icon="more_vert"
            ref="menuDropdown"
            size="large"
        >
            <ui-menu
                contain-focus
                has-icons
                slot="dropdown"
                :options="menuOptions"
                @select="selectMenuOption($event)"
                @close="$refs.menuDropdown.closeDropdown()"
                v-responsive.md.lg.xl
            ></ui-menu>
            <ui-menu
                contain-focus
                has-icons
                slot="dropdown"
                :options="mobileMenuOptions"
                @select="selectMenuOption($event)"
                @close="$refs.menuDropdown.closeDropdown()"
                v-responsive.xs.sm
            ></ui-menu>
        </ui-icon-button>

        <ui-modal ref="aboutModal" title="About">
            <div style="text-align: center;">
                <p class="about-text">
                    This is a hobby project by <a href="https://rjk.at">Rowan</a>. <a href="https://github.com/rjkat/anagrind">Click here</a> to view
                    the source code on github (MIT license). 
                    Install as a Chrome app or "Add to home screen" with Safari on iOS for quicker access to crosswords.
                </p>
                <form action="https://www.buymeacoffee.com/rjkat" target="_blank">
                    <ui-button color="primary" style="margin-top: 1em;">Buy me a coffee</ui-button>
                </form>
            </div>
        </ui-modal>
    </div>
</ui-toolbar>
</template>

<style lang="scss">
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

import AnaShareModal from './AnaShareModal.vue'

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

export default Vue.extend({
  components: {
    AnaShareModal
  },
  props: {
    metadata: Object,
    state: Object,
    shareLoading: false,
    shareLink: "",
    showInstall: false
  },
  computed: {
    menuOptions() {
        var options = [];
        if (this.showInstall) {
            options.push({
                label: 'Install app',
                icon: 'add'
            });
        }
            
        if (this.state.colluding) {
            options = options.concat([
            {
                label: 'Download .puz',
                icon: 'get_app'
            },
            {
                label: 'Download .eno',
                icon: 'get_app'
            },
            {
                label: 'Solve alone',
                icon: 'exit_to_app'
            },
            {
                label: 'About',
                icon: 'info'
            }]);
        } else if (!this.state.compiling) {
            options = options.concat([
            {
                label: 'Upload .puz/.eno',
                icon: 'publish'
            },
            {
                label: 'Download .puz',
                icon: 'get_app'
            },
            {
                label: 'Download .eno',
                icon: 'get_app'
            },
            {
                label: 'About',
                icon: 'info'
            }]);
        } else {
            options = options.concat([
            {
                label: 'Upload .puz/.eno',
                icon: 'publish'
            },
            {
                label: 'Download .puz',
                icon: 'get_app'
            },
            {
                label: 'Download .eno',
                icon: 'get_app'
            },
            {
                label: 'About',
                icon: 'info'
            }]);
        }
        return options;
    },
    mobileMenuOptions() {
        var options = [];
        if (this.showInstall) {
            options.push({
                label: 'Install app',
                icon: 'add'
            });
        }
        if (this.state.colluding) {
            options = options.concat([
            {
                label: 'Download .puz',
                icon: 'get_app'
            },
            {
                label: 'Download .eno',
                icon: 'get_app'
            },
            {
                label: 'Solve alone',
                icon: 'exit_to_app'
            },
            {
                label: 'About',
                icon: 'info'
            }]);
        } else if (!this.state.compiling) {
            options = options.concat([{
                label: 'Upload .puz/.eno',
                icon: 'publish'
            },
            {
                label: 'Download .puz',
                icon: 'get_app'
            },
            {
                label: 'Download .eno',
                icon: 'get_app'
            },
            {
                label: 'About',
                icon: 'info'
            }]);
        } else {
            options = options.concat([{
                label: 'Upload .puz/.eno',
                icon: 'publish'
            },
            {
                label: 'Download .puz',
                icon: 'get_app'
            },
            {
                label: 'Download .eno',
                icon: 'get_app'
            },
            {
                label: 'About',
                icon: 'info'
            }]);
        }
        return options;
    }
  },
  methods: {
    openModal(ref) {
        this.$refs[ref].open();
    },
    closeModal(ref) {
        this.$refs[ref].close();
    },
    handleFiles() {
        const self = this;
        let files = this.$refs.fileInput.files;
        const file = files[0];
        if (file.name.endsWith('.eno')) {
            file.arrayBuffer().then(
                buffer => self.$emit('eno-file-uploaded', buffer)
            )
        } else {
            file.arrayBuffer().then(
                buffer => self.$emit('puz-file-uploaded', buffer)
            )
        }
    },
    printClicked() {
        this.state.printing = true;
        this.state.compiling = false;
        Vue.nextTick(() => window.print());
    },
    selectMenuOption(option) {
        if (option.label == 'Download .puz') {
            this.$emit('download-puz-clicked');
        } else if (option.label == 'Download .eno') {
            this.$emit('download-eno-clicked');
        } else if (option.label == 'Solve alone') {
            this.$emit('go-offline-clicked');
        } else if (option.label == 'Upload .puz/.eno') {
            this.$refs.fileInput.click();
        } else if (option.label == 'About') {
            this.openModal('aboutModal');
        } else if (option.label == 'Install app') {
            this.$emit('install-clicked');
        }
    },
  },
  data() {
    return {
      bundler: "Parcel"
    };
  }
});
</script>

