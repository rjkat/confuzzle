<template>
<div class="cfz-crossword-clue-wrapper">
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
.cfz-crossword-clue-wrapper {
    padding-top: 1.5rem;
    padding-bottom: 1.5rem;
}

.author-note {
    width: 100%;
    display: block;
    font-family: $clueFontFamily;
    padding-right: .5em;
    padding-left: .5em;
    padding-top: $displayPadding;
    padding-bottom: $displayPadding;
    &:before {
        content: 'NOTE';
        font-weight: bold;
        padding-right: .5em;
    }
}

#solvers {
    padding-top: $displayPadding;
    padding-bottom: $displayPadding;
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
    padding-top: $displayPadding;
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
  },
  methods: {
    clueDeselected(clue) {
        const next = clue.nextRef;
        if (!next) {
            return;
        }
        const nextList = next.isAcross ? this.$refs.acrossList : this.$refs.downList;
        nextList.selectClue(next);
    },
  },
  data() {
    return {
      bundler: "Parcel",
    };
  }
});
</script>