<template>
<ui-toolbar class="cfz-control-toolbar hidden-print">
    <div slot="icon">
        <div style="display: flex; justify-content: space-between;">
        <ui-button
            color="primary"
            class="pencil-button"
            type="secondary"
            style="width: 2.25rem; font-weight: normal; min-width: 0; margin-left: .25rem;"
            @click="toggleUsingPencil()"
        ><div :style="pencilButtonStyle">A</div>
        </ui-button>
        <ui-button
            color="primary"
            class="backspace-button"
            type="secondary"
            icon="backspace"
            style="width: 2.75rem; min-width: 2.75rem; margin-left: .25rem; "
            @click="eraseClueClicked()"
        >
        </ui-button>
    </div>
    </div>
    <div slot="brand">
        <ui-button
            icon="lightbulb"
            type="primary"
            ref="checkButton"
            has-dropdown
            dropdownPosition="bottom-start"
            :constrainDropdownToScrollParent="false"
        >Hints
        <ui-menu
            contain-focus
            has-icons
            class="cfz-menu"
            slot="dropdown"
            :options="cheatOptions"
            @select="selectMenuOption($event)"
            @close="$refs.checkButton.closeDropdown()"
            >
        </ui-menu>
        </ui-button>
        <ui-button
            icon="dashboard"
            type="primary"
            ref="widgetButton"
            has-dropdown
            dropdownPosition="bottom-start"
            :constrainDropdownToScrollParent="false"
        >
            View
            <ui-menu
                contain-focus
                has-icons
                class="cfz-menu"
                slot="dropdown"
                :options="viewOptions"
                @select="selectMenuOption($event)"
                @close="$refs.widgetButton.closeDropdown()"
                >
            </ui-menu>
        </ui-button>
        <ui-button
            icon="delete"
            type="primary"
            :color="deleting ? 'red' : 'default'"
            @click="deleteClicked()"
            v-if="showDelete"
            v-responsive.lg.xl
        >
        {{deleteText}}
        </ui-button>
        <ui-button
            icon="cancel"
            type="primary"
            @click="cancelClicked()"
            v-if="deleting"
        >
        Cancel
        </ui-button>
        <ui-button
            icon="code"
            type="primary"
            @click="$emit('edit-source-clicked', $event)"
            v-responsive.lg.xl
            v-if="showEdit"
        >
        Edit
        </ui-button>
    </div>

</ui-toolbar>
</template>

<style lang="scss">
@import '../stylesheets/themes';

.backspace-button .ui-icon  {
    /*font-size: 1.3rem !important;*/
    /*height: 100%;*/
    padding-left: .25rem;
}
.cfz-control-toolbar {
    margin-left: 1px;
    height: 2rem !important;
    overflow: hidden;
    box-shadow: 0 0 2px rgb(0 0 0 / 12%), 0 2px 2px rgb(0 0 0 / 20%), inset 0 0 2px rgb(0 0 0 / 12%), inset 0 2px 2px rgb(0 0 0 / 20%) !important;

    .ui-button {
        height: calc(2rem - 6px) !important;
    }
}

</style>

<script>
import Vue from "vue";

export default Vue.extend({
  props: {
    showDelete: false,
    showEdit: true,
    showGrid: true,
    showTooltips: true,
    showTooltipToggle: false,
    showAnagramView: false,
    showAnagramViewEnabled: false,
    usingPencil: false,
    darkModeEnabled: false
  },
  model: {
    prop: 'usingPencil'
  },
  computed: {
    pencilButtonStyle() {
        const fam = !this.usingPencil ? '"notcouriersans"' : '"F*ck Beans"';
        return {
            'font-family': fam,
            'font-size': !this.usingPencil ? '1.6rem' : '1.4rem',
            'margin-top': !this.usingPencil ? '-0.25rem' : '0.2rem'
        };
    },
    deleteText() {
        return this.deleting ? 'Confirm' : 'Clear all'
    },
    cheatOptions() {
        return [
            this.opt.CHECK_WORD,
            this.opt.CHECK_ALL,
            this.opt.REVEAL_WORD,
            this.opt.REVEAL_ALL
        ];
    },
    viewOptions() {
        var options = [];
        if (this.showAnagramView || !this.showGrid) {
            options.push(this.opt.SHOW_GRID);
        }
        if (!this.showAnagramView || !this.showGrid) {
            options.push(this.opt.SHOW_ANAGRAM);
        }
        if (this.showGrid) {
            options.push(this.opt.SHOW_CLUES_ONLY);
        }
        if (this.showTooltipToggle) {
            if (this.showTooltips) {
                options.push(this.opt.SHOW_NO_TOOLTIPS);
            } else {
                options.push(this.opt.SHOW_TOOLTIPS);
            }
        }
        if (this.darkModeEnabled) {
            options.push(this.opt.DISABLE_DARK_MODE);
        } else {
            options.push(this.opt.ENABLE_DARK_MODE);
        }
        return options;
    }
  },
  methods: {
    
    toggleUsingPencil() {
        this.$emit('input', !this.usingPencil);
    },
    eraseClueClicked() {
        this.$emit('erase-clue-clicked')
    },
    selectMenuOption(option) {
        if (option.label == this.opt.CHECK_WORD.label) {
            this.$emit('check-word-clicked');
        } else if (option.label == this.opt.CHECK_ALL.label) {
            this.$emit('check-all-clicked');
        } else if (option.label == this.opt.REVEAL_WORD.label) {
            this.$emit('reveal-word-clicked');
        } else if (option.label == this.opt.REVEAL_ALL.label) {
            this.$emit('reveal-all-clicked');
        } else if (option.label == this.opt.SHOW_ANAGRAM.label) {
            if (!this.showGrid) {
                this.$emit('show-grid-changed', true);
            }
            this.$emit('show-anagram-changed', true);
        } else if (option.label == this.opt.SHOW_GRID.label) {
            if (!this.showGrid) {
                this.$emit('show-grid-changed', true);
            }
            this.$emit('show-anagram-changed', false);
        } else if (option.label == this.opt.SHOW_NO_TOOLTIPS.label) {
            this.$emit('show-tooltips-changed', false);
        } else if (option.label == this.opt.SHOW_TOOLTIPS.label) {
            this.$emit('show-tooltips-changed', true);
        } else if (option.label == this.opt.SHOW_CLUES_ONLY.label) {
            this.$emit('show-grid-changed', false);
        } else if (option.label == this.opt.ENABLE_DARK_MODE.label) {
            this.$emit('enable-dark-mode-changed', true);
        } else if (option.label == this.opt.DISABLE_DARK_MODE.label) {
            this.$emit('enable-dark-mode-changed', false);
        }
    },
    cancelClicked() {
        this.deleting = false;
    },
    deleteClicked() {
        if (this.deleting) {
            this.$emit('delete-all-clicked');
            this.deleting = false;
        } else {
            this.deleting = true;
        }
    },
    togglesChanged() {
        // TODO: why doesn't toggling work properly
        if (this.toggles.length == 0) {
            this.toggles.push('tooltips');
        }
        this.$emit('toggles-changed', JSON.parse(JSON.stringify(this.toggles)));
    }
  },
  data() {
    return {
      gridOnly: ['grid'],
      gridAndTooltips: ['grid', 'tooltips'],
      toggles: ['grid', 'tooltips'],
      lastTooltipVal: true,
      bundler: "Parcel",
      deleting: false,
      opt: {
        CHECK_WORD: {
            label: 'Check word',
            icon: 'playlist_add_check'
        },
        CHECK_ALL: {
            label: 'Check all',
            icon: 'playlist_add_check'
        },
        REVEAL_WORD: {
            label: 'Reveal word',
            icon: 'visibility'
        },
        REVEAL_ALL: {
            label: 'Reveal all',
            icon: 'visibility'
        },
        SHOW_GRID: {
            label: 'Grid',
            icon: 'grid_on'
        },
        SHOW_ANAGRAM: {
            label: 'Anagram',
            icon: 'gesture'
        },
        SHOW_TOOLTIPS: {
            label: 'Tooltips',
            icon: 'speaker_notes'
        },
        SHOW_NO_TOOLTIPS: {
            label: 'No tooltips',
            icon: 'speaker_notes_off'
        },
        ENABLE_DARK_MODE: {
            label: 'Dark theme',
            icon: 'nightlight'
        },
        DISABLE_DARK_MODE: {
            label: 'Light theme',
            icon: 'light_mode'
        },
        SHOW_CLUES_ONLY: {
            label: 'Clues',
            icon: 'list'
        },
      }
      
    };
  }
});
</script>