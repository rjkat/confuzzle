<template>
<div class="crossword-clues" :data-is-across="isAcross">
    <ul>
        <li is="ana-clue"
            v-for="clue in clues"
            v-bind:clue="clue"
            @mouseover="cwDisplay.drawOwnHighlight(clue.id)"
            @mouseout="cwDisplay.clearOwnHighlight(clue.id)">
        </li>
    </ul>
</div>
</template>

<script>
import Vue from "vue";

import AnaClue from './AnaClue.vue'

export default Vue.extend({
  components: {
    AnaClue
  },
  props: {
    cwDisplay: Object,
    clues: {
        type: Array,
        required: true
    },
    isAcross: {
        type: Boolean,
        default: false
    }
  },
  data() {
    return {
      bundler: "Parcel"
    };
  }
});
</script>
