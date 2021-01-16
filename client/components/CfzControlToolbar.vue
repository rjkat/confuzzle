<template>
<ui-toolbar class="cfz-control-toolbar hidden-print">
    <ui-checkbox-group class="toggle-checkboxes" :options="showTooltipToggle ? gridAndTooltips : gridOnly" v-model="toggles" @change="togglesChanged($event)" slot="icon"></ui-checkbox-group>
        
    <div slot="brand">
        <ui-button
            icon="star"
            type="primary"
            ref="checkButton"
            has-dropdown
        >
        Cheat
            <ui-menu
                contain-focus
                has-icons
                class="cfz-menu"
                position="bottom-start"
                slot="dropdown"
                :options="cheatOptions"
                @select="selectCheatMenuOption($event)"
                @close="$refs.checkButton.closeDropdown()">
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

.tippy-popper {
    margin-top: $displayPadding;
    margin-left: -8px;
}
</style>

<script>
import Vue from "vue";

export default Vue.extend({
  props: {
    showDelete: false,
    showEdit: true,
    showTooltipToggle: false
  },
  computed: {
    deleteText() {
        return this.deleting ? 'Confirm' : 'Clear all'
    },
    cheatOptions() {
        
    }
  },
  methods: {
    selectCheatMenuOption(option) {
        if (option.label == 'Check word') {
            this.$emit('check-word-clicked');
        } else if (option.label == 'Check all') {
            this.$emit('check-all-clicked');
        } else if (option.label == 'Reveal word') {
            this.$emit('reveal-word-clicked');
        } else if (option.label == 'Reveal all') {
            this.$emit('reveal-all-clicked');
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
      cheatOptions: [
        {
            label: 'Check word',
            icon: 'playlist_add_check'
        },
        {
            label: 'Check all',
            icon: 'playlist_add_check'
        },
        {
            label: 'Reveal word',
            icon: 'visibility'
        },
        // {
        //     label: 'Reveal all',
        //     icon: 'visibility'
        // }
      ]
    };
  }
});
</script>