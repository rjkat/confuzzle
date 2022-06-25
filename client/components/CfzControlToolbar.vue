<template>
<ui-toolbar class="cfz-control-toolbar hidden-print">
    <div slot="icon">
        <div style="display: flex; justify-content: space-between;">
            <ui-button
                class="pencil-button"
                type="secondary"
                color="primary"
                style="width: 2.25rem; font-weight: normal; min-width: 0; margin-left: .25rem;"
                @click="toggleUsingPencil()"
            ><div :style="pencilButtonStyle">A</div>
            </ui-button>
            <ui-button
                v-if="showMark"
                class="clue-action-button clue-mark-button"
                type="secondary"
                color="primary"
                icon="star_half"
                :data-mark-count="markCount"
                style="width: 2.75rem; min-width: 2.75rem; margin-left: .25rem; "
                @click="markClueClicked()"
            >
            </ui-button>
            <ui-button
                v-if="showErase"
                class="clue-action-button"
                type="primary"
                icon="backspace"
                style="width: 2.75rem; min-width: 2.75rem; margin-left: .25rem; "
                @click="eraseClueClicked()"
            >
            </ui-button>
            <template v-for="(option, i) in viewOptions">
                <ui-button
                    type="secondary"
                    :color="option.modal ? 'default' : 'primary'"
                    :icon="option.icon"
                    :disabled="option.highlighted"
                    style="width: 2.75rem; min-width: 2.75rem; margin-left: .25rem; padding-right: .25rem;"
                    @click="selectMenuOption(option)"
                    >
                    <div style="position: absolute; bottom: -.15rem; left: .4rem;" v-if="option.highlighted">.</div>
                </ui-button>
            </template>
        </div>
    </div>
    <div slot="brand">
        <!-- <ui-button
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
        </ui-button> -->
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
    </div>
    <div slot="actions" style="padding-right: 1rem;">
        <ui-button
            icon="lightbulb"
            type="primary"
            ref="checkButton"
            style="width: 2.75rem; min-width: 2.75rem; margin-left: .25rem;"
            has-dropdown
            dropdownPosition="bottom-end"
            :constrainDropdownToScrollParent="false"
        >
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
            icon="code"
            type="primary"
            @click="$emit('edit-source-clicked', $event)"
            v-responsive.lg.xl
            v-if="showEdit"
            style="align-self: flex-end; width: 2.75rem; min-width: 2.75rem; margin-left: .25rem; padding-right: .25rem;"
        >
        </ui-button>
    </div>

</ui-toolbar>
</template>

<style lang="scss">
@import '../stylesheets/themes';

.clue-action-button .ui-icon  {
    /*font-size: 1.3rem !important;*/
    /*height: 100%;*/
    padding-left: .25rem;
}
.clue-mark-button:after {
    min-width: 1.5em;
    margin-left: -.5em;
    height: 100%;
    content: attr(data-mark-count);
    margin-top: 1.5em;
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
    showMark: true,
    markCount: Number,
    showErase: true,
    showDelete: false,
    showEdit: true,
    showGrid: true,
    showToggleDarkMode: true,
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
        this.opt.SHOW_ANAGRAM.highlighted = this.showAnagramView && this.showGrid;
        this.opt.SHOW_GRID.highlighted = !this.showAnagramView && this.showGrid;
        this.opt.SHOW_CLUES_ONLY.highlighted = !this.showGrid;
        
        options.push(this.opt.SHOW_GRID);
        options.push(this.opt.SHOW_CLUES_ONLY);
        options.push(this.opt.SHOW_ANAGRAM);

        if (this.showTooltipToggle) {
            if (this.showTooltips) {
                options.push(this.opt.SHOW_NO_TOOLTIPS);
            } else {
                options.push(this.opt.SHOW_TOOLTIPS);
            }
        }
        if (this.showToggleDarkMode) {
            if (this.darkModeEnabled) {
                options.push(this.opt.DISABLE_DARK_MODE);
            } else {
                options.push(this.opt.ENABLE_DARK_MODE);
            }
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
    markClueClicked() {
        this.$emit('mark-clue-clicked')
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
            icon: 'grid_on',
            modal: true
        },
        SHOW_ANAGRAM: {
            label: 'Anagram',
            icon: 'gesture',
            modal: true
        },
        SHOW_TOOLTIPS: {
            label: 'Tooltips',
            icon: 'speaker_notes',
        },
        SHOW_NO_TOOLTIPS: {
            label: 'No tooltips',
            icon: 'speaker_notes_off',
        },
        ENABLE_DARK_MODE: {
            label: 'Dark theme',
            icon: 'nightlight',
        },
        DISABLE_DARK_MODE: {
            label: 'Light theme',
            icon: 'light_mode',
        },
        SHOW_CLUES_ONLY: {
            label: 'Clues',
            icon: 'list',
            modal: true
        },
      }
      
    };
  }
});
</script>