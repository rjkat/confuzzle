<template>
<div>
    <ui-toolbar class="cfz-clue-list-toolbar hidden-print">
        <ui-checkbox-group class="toggle-checkboxes" :options="showTooltipToggle ? gridAndTooltips : gridOnly" v-model="toggles" @change="togglesChanged($event)" slot="icon"></ui-checkbox-group>
            
        <div slot="brand">
            <ui-button
                icon="playlist_add_check"
                type="secondary"
                @click="$emit('check-answer-clicked', $event)"
            >
            Check
            </ui-button>
            <ui-button
                icon="visibility"
                type="secondary"
                @click="$emit('reveal-answer-clicked', $event)"
            >
            Reveal
            </ui-button>
            <ui-button
                icon="edit"
                type="secondary"
                @click="$emit('edit-source-clicked', $event)"
                v-responsive.lg.xl
                v-if="showEdit"
            >
            Edit
            </ui-button>
            <ui-button
                icon="delete"
                type="secondary"
                :color="deleting ? 'red' : 'default'"
                @click="deleteClicked()"
                v-if="showDelete"
                v-responsive.lg.xl
            >
            {{deleteText}}
            </ui-button>
            <ui-button
                icon="cancel"
                type="secondary"
                @click="cancelClicked()"
                v-if="deleting"
            >
            Cancel
            </ui-button>
        </div>

    </ui-toolbar>
    <cfz-solver-list v-if="state.colluding" id="solvers" class="hidden-print" :solvers="solvers"></cfz-solver-list>
    <div class="author-note" v-if="crossword.meta.note" v-html="noteHTML"></div>
    <div class="cfz-clue-list-container">

        <cfz-clue-list
            class="clue-list"
            ref="acrossList"
            data-across
            :solverid="solverid"
            @deselect-clue="clueDeselected($event)"
            v-model="crossword.acrossClues"
            v-on="$listeners"
        >
        </cfz-clue-list>
        <cfz-clue-list
            class="clue-list"
            ref="downList"
            data-down
            :solverid="solverid"
            @deselect-clue="clueDeselected($event)"
            v-model="crossword.downClues"
            v-on="$listeners"
        >
        </cfz-clue-list>
    </div>
</div>
</template>

<style lang="scss">
.author-note {
    width: 100%;
    display: block;
    font-family: $clueFontFamily;
    padding-right: .5em;
    padding-left: .5em;
    padding-top: .5em;
    padding-bottom: $displayPadding;
    &:before {
        content: 'NOTE';
        font-weight: bold;
        padding-right: .5em;
    }
}

#solvers {
    padding-bottom: $displayPadding;
}

.cfz-clue-list-toolbar {
    position: sticky;
    top: 0;
    height: 2.25rem !important;
    margin-bottom: $displayPadding;
    background-color: #efefef;
    z-index: 2;
}

.toggle-checkboxes {
    padding-left: $displayPadding;
}

.toggle-checkboxes .ui-checkbox__label-text {
    font-family: $titleFontFamily;
    font-size: 0.875rem !important;
    font-weight: 600 !important;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    line-height: 1;
}

.cfz-clue-list-container {
    display: flex;
    flex: 1 1 auto;
    flex-wrap: wrap;

    .clue-list {
        flex: 50%;
        margin: 0 auto;
        min-width: $clueMinWidth;
        font-family: $clueFontFamily;
        &[data-across]:before {
            content: 'ACROSS';
            font-weight: bold;
            padding: .5em;
        }

        &[data-down]:before {
            content: 'DOWN';
            font-weight: bold;
            padding: .5em;
        }
    }
}
</style>

<script>
import Vue from "vue";
const sanitizeHtml = require('sanitize-html');

import CfzClueList from './CfzClueList.vue'
import CfzSolverList from './CfzSolverList.vue'

export default Vue.extend({
  components: {
    CfzClueList,
    CfzSolverList
  },
  props: {
    crossword: Object,
    state: Object,
    solvers: Object,
    solverid: {
        type: Number,
        default: 0
    },
    showDelete: false,
    showEdit: true,
    showTooltipToggle: false
  },
  model: {
    prop: 'crossword'
  },
  computed: {
    noteHTML: function () {
        if (!this.crossword)
            return '';
        let meta = this.crossword.meta;
        return sanitizeHtml(meta.note, {
            allowedTags: [ 
                'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'ul', 'ol', 'nl',
                'li', 'b', 'i', 'strong', 'em', 'strike', 'abbr', 'code'
            ]
        });
    },
    deleteText() {
        return this.deleting ? 'Confirm' : 'Delete all'
    },
  },
  methods: {
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
    clueDeselected(clue) {
        const next = clue.nextRef;
        if (!next) {
            return;
        }
        const nextList = next.isAcross ? this.$refs.acrossList : this.$refs.downList;
        nextList.selectClue(next);
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
      deleting: false
    };
  }
});
</script>