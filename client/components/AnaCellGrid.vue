<template>
<table class="crossword-grid" cell-spacing="0">
    <tr v-for="row in crossword.grid.cells">
        <ana-cell v-for="cell in row" :cell="cell"></ana-cell>
    </tr>
</table>
</template>

<style lang="scss">
.crossword-grid {
    text-transform: uppercase;
    background-color: $gridBlankColor;
    display:inline-block;
    border: $gridBorderWidth solid;
    border-collapse: collapse;
}

.crossword-grid-input {
    font-size: $gridFontSize;
    font-family: $answerFontFamily;
    padding: $gridBorderWidth 0 0 $gridBorderWidth;
    border: 0;
    background: none;
    outline: none;
    min-width: $gridCellSize;
    max-width: $gridCellSize;
    height: $gridCellSize;
    line-height: $gridCellSize;
    position: absolute;
    text-align: center;
    vertical-align: middle;
    text-transform: inherit;
}
</style>

<script>
import Vue from "vue";
import AnaCell from './AnaCell.vue'

export default Vue.extend({
  components: {
    AnaCell
  },
  props: {
    crossword: Object
  },
  data() {
    return {
      bundler: "Parcel"
    };
  }
});
</script>
