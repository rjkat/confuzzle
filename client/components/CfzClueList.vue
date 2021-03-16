<template>
<div class="crossword-clues">
    <ul>
        <li is="cfz-clue"
            ref="items"
            v-for="(clue, i) in filteredClues"
            v-on="$listeners"
            v-model="filteredClues[i]"
            :usingPencil="usingPencil"
            :solverid="solverid"
            @mouseover="$emit('draw-own-highlight', clue.id)"
            @mouseout="$emit('clear-own-highlight', clue.id)"
            >
        </li>
    </ul>
</div>
</template>

<style lang="scss" scoped>
@import '../stylesheets/solvers';

@media screen {
    @include each-solver using ($color, $lightColor, $sel) {
        li.highlighted#{$sel} {
            color: $lightColor
        }
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
import CfzClue from './CfzClue.vue'

export default Vue.extend({
  components: {
    CfzClue
  },
  model: {
    prop: 'clues'
  },
  props: {
    clues: {
        type: Array,
        required: true
    },
    solverid: {
        type: Number,
        default: 0
    },
    usingPencil: Boolean
  },
  computed: {
    filteredClues() {
        const filtered = [];
        for (var i = 0; i < this.clues.length; i++) {
            if (!this.clues[i].hidden) {
                filtered.push(this.clues[i]);
            }
        }
        return filtered;
    }
  },
  methods: {
    selectClue(clue) {
        for (var i = 0; i < this.clues.length; i++) {
            if (this.clues[i].id == clue.id) {
                this.$refs.items[i].directionsClicked(true)
                break;
            }
        }
    }
  },
  data() {
    return {
      bundler: "Parcel"
    };
  }
});
</script>
