<template>
<ui-toolbar type="colored" removeNavIcon>
    <template v-slot="title">
        <span style="{display: inline-flex; align-items: center;}">
            <span class="crossword-meta-name">{{metadata.name}}</span>
            <span class="crossword-meta-author">by {{metadata.author}}</span>
            <span class="crossword-meta-identifier" v-if="metadata.identifier">{{metadata.identifier}}</span>
        </span>
    </template>
    <div slot="actions" class="hidden-print">
        <ui-icon-button
            color="white"
            has-dropdown
            icon="print"
            size="large"
            @click="printClicked()"
        >
        </ui-icon-button>
        <ui-icon-button
            color="white"
            has-dropdown
            icon="people"
            size="large"
            @click="openModal('shareModal')"
        >
        </ui-icon-button>
        <ana-share-modal ref="shareModal"></ana-share-modal>

        <input type="file" ref="fileInput"
            accept="application/x-crossword"
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
            ></ui-menu>
        </ui-icon-button>

        <ui-modal ref="aboutModal" title="About anagrind.com">
            <p class="about-text">This is a hobby project by <a href="https://rjk.at">Rowan</a>. <a href="https://github.com/rjkat/anagrind">Click here</a> to view
            the source code on github (MIT license).</p>
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
}
</style>

<script>
import Vue from "vue";

import AnaShareModal from './AnaShareModal.vue'

export default Vue.extend({
  components: {
    AnaShareModal
  },
  props: {
    metadata: Object,
    state: Object
  },
  model: {
    prop: 'state'
  },
  computed: {
    menuOptions() {
        if (!this.state.compiling) {
            return [{
                label: 'Edit',
                icon: 'edit'
            },
            {
                label: 'Upload .puz',
                icon: 'publish'
            },
            {
                label: 'Download .puz',
                icon: 'get_app'
            },
            {
                label: 'About',
                icon: 'info'
            }];
        } else {
            return [{
                label: 'Preview',
                icon: 'visibility'
            },
            {
                label: 'Upload .puz',
                icon: 'publish'
            },
            {
                label: 'Download .puz',
                icon: 'get_app'
            },
            {
                label: 'About',
                icon: 'info'
            }];
        }
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
        console.log(files)
        files = [...files];
        files.forEach(file => file.arrayBuffer().then(
            buffer => self.$emit('puz-file-uploaded', buffer)
        ));
    },
    printClicked() {
        this.state.printing = true;
        this.state.compiling = false;
        Vue.nextTick(() => window.print());
    },
    selectMenuOption(option) {
        if (option.label == 'Edit' || option.label == 'Preview') {
            this.state.compiling = !this.state.compiling;
        } else if (option.label == 'Download .puz') {
            this.$emit('download-clicked');
        } else if (option.label == 'Upload .puz') {
            this.$refs.fileInput.click();
        } else if (option.label == 'About') {
            this.openModal('aboutModal');
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

