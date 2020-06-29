<template>
<div>
  <table class="crossword-grid" cell-spacing="0">
      <tr v-for="row in value.grid.cells">
          <ana-cell v-for="cell in row"
                    v-model="value.grid.cells[cell.row][cell.col]"
                    @change-input-direction="changeInputDirection($event)">
          </ana-cell>
      </tr>
  </table>
</div>
</template>

<style lang="scss">
.crossword-grid {
    text-transform: uppercase;
    background-color: $gridBlankColor;
    display:inline-block;
    border-collapse: collapse;
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
    value: Object,
    enableInput: {
      type: Boolean,
      default: true
    },
    inputAcross: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    changeInputDirection() {
      this.inputAcross = !this.inputAcross;
    }
  },
  data() {
    return {
      bundler: "Parcel"
    };
  }
});
</script>
