<template>
<div id="solve-panel">
    <div class="crossword-clue-panel">
        <div class="crossword-clue-container">
            <div class="author-note" v-if="crossword && crossword.meta.note">{{noteHTML}}</div>
            <ana-clue-list data-across :clues="acrossClues"></ana-clue-list>
            <ana-clue-list data-down :clues="downClues"></ana-clue-list>
        </div>
    </div>
</div>
</template>

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
  computed: {
    acrossClues: function () {
        if (!this.crossword)
            return [];
        let cs = [];
        for (let [clueid, clue] of
             Object.entries(this.crossword.clues)) {
            if (clue.isAcross) {
                cs.push(clue);
            }
        }
        return cs;
    },
    downClues: function () {
        if (!this.crossword)
            return [];
        let cs = [];
        for (let [clueid, clue] of
             Object.entries(this.crossword.clues)) {
            if (!clue.isAcross) {
                cs.push(clue);
            }
        }
        return cs;
    },
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
  data() {
    return {
      bundler: "Parcel"
    };
  }
});
</script>