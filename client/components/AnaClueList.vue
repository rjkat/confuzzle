<template>
<div class="crossword-clues">
    <ul>
        <li is="ana-clue"
            v-for="(clue, i) in clues"
            v-on="$listeners"
            :clue="clues[i]"
            @mouseover="$emit('draw-own-highlight', clue.id)"
            @mouseout="$emit('clear-own-highlight', clue.id)"
            >
        </li>
    </ul>
</div>
</template>

<style lang="scss">
@import '../stylesheets/solvers';

@include each-solver using ($color, $lightColor, $sel) {
    li.highlighted#{$sel} {
        color: $lightColor
    }
}

@include each-solver using ($color, $lightColor, $sel) {
    .highlighted#{$sel} input {
        padding-bottom: 0px;
        border-bottom: 2px solid $color;
    }
}

ul {
    list-style: none;
    margin: 0;
    padding: 1em .5em 1em .5em;

    li {
        line-height: 1.5em;
        padding-bottom: .5em;
        .clue-directions {
            cursor: pointer;
        }
    }
}
</style>

<script>
import Vue from "vue";
import AnaClue from './AnaClue.vue'

export default Vue.extend({
  components: {
    AnaClue
  },
  model: {
    prop: 'clues'
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
