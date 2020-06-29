<template>
<div>
    <div class="author-note" v-if="crossword.meta.note" v-html="noteHTML"></div>
    <div class="ana-clue-list-container">
        <ana-clue-list
            class="clue-list"
            data-across
            v-model="crossword.acrossClues"
            v-on="$listeners"
        >
        </ana-clue-list>
        <ana-clue-list
            class="clue-list"
            data-down
            v-model="crossword.downClues"
            v-on="$listeners"
        >
        </ana-clue-list>
    </div>
</div>
</template>

<style lang="scss">
.author-note {
    text-align: center;
    width: 100%;
    font-family: $clueFontFamily;
    padding-bottom: $displayPadding;
}
.ana-clue-list-container {
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

import AnaClueList from './AnaClueList.vue'

export default Vue.extend({
  components: {
    AnaClueList
  },
  props: {
    crossword: Object,
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
    }
  },
  methods: {
  },
  data() {
    return {
      bundler: "Parcel"
    };
  }
});
</script>