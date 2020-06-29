<template>
<ui-toolbar type="colored" removeNavIcon>
    <template v-slot="title">
        <span style="{display: inline-flex; align-items: center;}">
            <span class="crossword-meta-name">{{metadata.name}}</span>
            <span class="crossword-meta-author">by {{metadata.author}}</span>
            <span class="crossword-meta-identifier" v-if="metadata.identifier">{{metadata.identifier}}</span>
        </span>
    </template>
    <div slot="actions">
        <ui-icon-button
            color="white"
            has-dropdown
            icon="publish"
            size="large"
        >
        </ui-icon-button>
        <ui-icon-button
            color="white"
            has-dropdown
            icon="share"
            size="large"
            @click="openModal('shareModal')"
        >
        </ui-icon-button>
        <ana-share-modal ref="shareModal"></ana-share-modal>
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
    </div>
</ui-toolbar>
</template>

<style lang="scss">
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
    compiling: Boolean
  },
  computed: {
    menuOptions() {
        if (!this.compiling) {
            return [{
                label: 'Edit',
                icon: 'edit'
            },
            {
                label: 'Download',
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
                label: 'Download',
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
    selectMenuOption(option) {
        if (option.label == 'Edit' || option.label == 'Preview') {
            this.$emit('update:compiling', option.label == 'Edit');
        } else if (option.label == 'Download') {
            this.$emit('download-clicked');
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

