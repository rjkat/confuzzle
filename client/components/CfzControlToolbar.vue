<template>
<ui-toolbar class="cfz-control-toolbar hidden-print">
    <div slot="icon"></div>
    <div slot="brand">
        <ui-button
            icon="star"
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
            icon="widgets"
            type="primary"
            ref="widgetButton"
            has-dropdown
            dropdownPosition="bottom-start"
            :constrainDropdownToScrollParent="false"
        >
            Widgets
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
            icon="edit"
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
.cfz-control-toolbar {
    height: 2rem !important;
    background-color: #efefef;
    overflow-y: hidden;
    z-index: 2;
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
    showScratchpad: false,
    showScratchpadEnabled: false
  },
  computed: {
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
        if (this.showScratchpad || !this.showGrid) {
            options.push(this.opt.SHOW_GRID);
        }
        if (!this.showScratchpadEnabled) {
            options.push(this.opt.SHOW_DECRYPT_DISABLED);
        } else {
            if (!this.showScratchpad) {
                options.push(this.opt.SHOW_DECRYPT);
            }
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
        return options;
    }
  },
  methods: {
    
    selectMenuOption(option) {
        if (option.label == this.opt.CHECK_WORD.label) {
            this.$emit('check-word-clicked');
        } else if (option.label == this.opt.CHECK_ALL.label) {
            this.$emit('check-all-clicked');
        } else if (option.label == this.opt.REVEAL_WORD.label) {
            this.$emit('reveal-word-clicked');
        } else if (option.label == this.opt.REVEAL_ALL.label) {
            this.$emit('reveal-all-clicked');
        } else if (option.label == this.opt.SHOW_DECRYPT.label) {
            if (!this.showGrid) {
                this.$emit('show-grid-changed', true);
            }
            this.$emit('show-scratchpad-changed', true);
        } else if (option.label == this.opt.SHOW_GRID.label) {
            if (!this.showGrid) {
                this.$emit('show-grid-changed', true);
            }
            this.$emit('show-scratchpad-changed', false);
        } else if (option.label == this.opt.SHOW_NO_TOOLTIPS.label) {
            this.$emit('show-tooltips-changed', false);
        } else if (option.label == this.opt.SHOW_TOOLTIPS.label) {
            this.$emit('show-tooltips-changed', true);
        } else if (option.label == this.opt.SHOW_CLUES_ONLY.label) {
            this.$emit('show-grid-changed', false);
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
        SHOW_DECRYPT: {
            label: 'Breakdown',
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
        SHOW_DECRYPT_DISABLED: {
            label: 'Breakdown',
            icon: 'gesture',
            disabled: true
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