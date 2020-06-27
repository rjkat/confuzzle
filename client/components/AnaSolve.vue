<template>
<div id="solve-panel">
    <div class="crossword-clue-panel">
        <div class="crossword-clue-container">
            <div class="author-note" v-if="crossword.meta.note">{{noteHTML}}</div>
            <ana-clue-list is-across="true"  clues="acrossClues"/>
            <ana-clue-list is-across="false" clues="downClues"/>
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
    cwDisplay: Object,
  },
  computed: {
    crossword: function () {
        return this.cwDisplay.crossword;
    },
    acrossClues: function () {
        let cs = [];
        for (let [clueid, clue] of
             Object.entries(this.cwDisplay.crossword.clues)) {
            if (clue.isAcross) {
                cs.push(clue);
            }
        }
        return cs;
    },
    downClues: function () {
        let cs = [];
        for (let [clueid, clue] of
             Object.entries(this.cwDisplay.crossword.clues)) {
            if (!clue.isAcross) {
                cs.push(clue);
            }
        }
        return cs;
    },
    noteHTML: function () {
        let meta = this.cwDisplay.crossword.meta;
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