<template>
<div class="crossword-clues">
    <div class="crossword-clues-label">{{isAcross ? 'ACROSS' : 'DOWN'}}</div>
    <div class="crossword-clues-ul">
        <div class="crossword-clues-li"
            is="cfz-clue"
            ref="items"
            v-for="(clue, i) in clues"
            v-if="clue.isAcross == isAcross"
            v-on="$listeners"
            v-model="clues[i]"
            :gridCells="gridCells"
            :usingPencil="usingPencil"
            :solverid="solverid"
            :solvers="solvers"
            @select-clue="$emit('select-clue', $event)"
            @mouseover="$emit('draw-own-highlight', clue.id)"
            @mouseout="$emit('clear-own-highlight', clue.id)"
            >
        </div>
    </div>
</div>
</template>

<style lang="scss" scoped>
@import '../stylesheets/solvers';

@media screen {
    @include each-solver using ($color, $lightColor, $sel) {
        .theme-light, * {
            .crossword-clues-li[data-highlighted]#{$sel} {
                color: $lightColor;
            }
        }
        @media (prefers-color-scheme: dark) {
            .crossword-clues-li[data-highlighted]#{$sel} {
                color: $color;
            }
        }
        .theme-dark .crossword-clues-li[data-highlighted]#{$sel} {
            color: $color;
        }
    }
}

.crossword-clues {
    font-family: $clueFontFamily;
}

.crossword-clues-label {
    font-family: $titleFontFamily;
    @media screen {
        padding-left: .5em;
        padding-top: .5em;
        padding-bottom: .5em;
    }
}

.crossword-clues-ul {
    list-style: none;
    margin: 0;

    @media screen {
        padding: 1em .5em 1em .5em;
    }

    .crossword-clues-li {

        @media screen {
            padding-bottom: .5em;
            line-height: 1.5em;
        }
        .clue-directions {
            cursor: pointer;
        }
    }

    @media print {
        padding-top: .5em;
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
    isAcross: Boolean,
    solvers: Array,
    gridCells: Object,
    clues: {
        type: Object,
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
    scrollToClue(clue) {

        for (let i = 0; i < this.$refs.items.length; i++) {
            if (this.$refs.items[i].clue.id == clue.id) {
                this.$refs.items[i].directionsClicked(true)
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
