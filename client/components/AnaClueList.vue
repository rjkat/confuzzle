<template>
<div class="crossword-clues">
    <ul>
        <li is="ana-clue"
            v-for="clue in clues"
            :clue=clue
            @mouseover="$emit('draw-own-highlight', clue.id)"
            @mouseout="$emit('clear-own-highlight', clue.id)">
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
    clues: {
        type: Array,
        required: true
    },
  },
  data() {
    return {
      bundler: "Parcel"
    };
  }
});
</script>
