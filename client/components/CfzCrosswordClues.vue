<template>
<div class="cfz-crossword-clue-wrapper">
    <div class="copyright-text hidden-print">{{crossword.meta.copyrightText}}</div>
    <div v-if="crossword.meta.url" class="copyright-text hidden-print">Obtained from <a :href="crossword.meta.url" target="_blank" rel="noopener" style="overflow-wrap: anywhere;">{{crossword.meta.url}}<ui-icon style="font-size: 12pt;">open_in_new</ui-icon></a></div>
    <div v-if="crossword.meta.gid" class="copyright-text hidden-print">Solve at <a :href="'https://grids.confuzzle.me/' + crossword.meta.gid" target="_blank" rel="noopener" style="overflow-wrap: anywhere;">https://grids.confuzzle.me/{{crossword.meta.gid}}</a></div>
    <cfz-solver-list v-if="state.colluding" id="solvers" class="hidden-print" :solvers="solvers"></cfz-solver-list>
    <div class="author-note" v-if="crossword.meta.note" v-html="noteHTML"></div>
    <div class="cfz-clue-list-container">
        <cfz-clue-list 
            class="clue-list clue-list-across"
            ref="acrossList"
            :isAcross="true"
            :usingPencil="usingPencil"
            :solverid="solverid"
            @deselect-clue="clueDeselected($event)"
            @move-to-clue="moveToClue($event)"
            v-model="crossword.acrossClues"
            v-on="$listeners"
            v-if="!hideAcross"
        >
        </cfz-clue-list>
        <cfz-clue-list
            class="clue-list clue-list-down"
            ref="downList"
            :isAcross="false"
            :data-portrait="isPortrait"
            :usingPencil="usingPencil"
            :solverid="solverid"
            @deselect-clue="clueDeselected($event)"
            @move-to-clue="moveToClue($event)"
            v-model="crossword.downClues"
            v-on="$listeners"
            v-if="!hideDown"
        >
        </cfz-clue-list>
    </div>
</div>
</template>

<style lang="scss">
@import '../stylesheets/themes';

.cfz-crossword-clue-wrapper {
    overflow-x: hidden;
    @media screen {
        padding-top: 1rem;
        padding-bottom: 1.5rem;
        max-height: calc(100% - 2rem);
    }
    color: var(--clue-text-color);
}

.author-note {
    width: 100%;
    display: block;
    font-family: $clueFontFamily;
    @media print {
        font-size: 10pt;
    }
    @media screen {
        padding-left: .5em;
        padding-right: .5em;
        padding-top: $displayPadding;
    }
    padding-bottom: $displayPadding;
    &:before {
        content: 'NOTE';
        font-family: $titleFontFamily;
        font-size: 16px;
        padding-right: .5em;
    }
}

.copyright-text {
    width: 100%;
    font-family: $clueFontFamily;
    font-size: 10pt;
    padding-right: .5em;
    padding-bottom: .5em;
    color: var(--copyright-text-color);
    padding-left: .5em;
}

#solvers {
    margin-top: $displayPadding;
    margin-bottom: $displayPadding;
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
    
    @media screen {
        margin-top: $displayPadding;
    }


    @media print {
        flex: 1 1 auto;
        justify-content: space-between;
    }

    @media screen {
        flex: 1 1 auto;
        flex-wrap: wrap;
        .clue-list-down {
            min-width: 33vw;
            &[data-portrait] {
                min-width: 100% !important;
            }
        }
    }
    .clue-list {
        flex: 50%;
        margin: 0 auto;
    }
    .clue-list-across {
        @media print {
            padding-right: 1em;
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
    isPortrait: Boolean,
    hideAcross: Boolean,
    hideDown: Boolean,
    usingPencil: Boolean,
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
    moveToClue(event) {
        nextList.selectClue(event.clue, event.at_index);
    },
  },
  data() {
    return {
      bundler: "Parcel",
    };
  }
});
</script>