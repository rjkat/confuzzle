<template>
    <div class="solvers-list">
        <div class="solvers-list-item solvers-text" v-if="titleText">{{titleText}}</div>
        <div class="solvers-list-item highlighted" v-for="item in items" :data-solver-mask="(1 << (item.solverid % 8))">
            {{item.name[0]}}<ui-tooltip class="solver-tooltip">{{item.name}}</ui-tooltip>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import '../stylesheets/solvers';
.solver-tooltip {
    font-family: $answerFontFamily;
    font-size: $gridFontSize;   
    text-transform: uppercase;     
}
.solvers-list {
    vertical-align: middle;
    margin: 0;
    padding: 0;
    display: flex;
    .solvers-list-item {
        display: flex;
        align-items: center;
    }
    .solvers-list-item.solvers-text {
        font-family: $titleFontFamily;

        margin-left: 0.5em;
        padding-right: $displayPadding;
    }

    .solvers-list-item.highlighted {
        font-family: $answerFontFamily;
        color: var(--text-color);
        font-size: $gridFontSize;
        min-width: $gridCellSize;
        max-width: $gridCellSize;
        min-height: $gridCellSize;
        height: $gridCellSize;
        max-height: $gridCellSize;
        line-height: 1ch;
        position: relative;
        justify-content: center;
        text-transform: uppercase;
        border: 1px solid #000;
        margin-left: -1px;
        cursor: pointer;
        box-sizing: content-box;

        @include each-solver using ($color, $lightColor, $sel) {
          .theme-light &#{$sel}, &#{$sel} {
              background-color: $color;
          }

          @media (prefers-color-scheme: dark) {
            &#{$sel} {
              background-color: $lightColor;
            }
          }

          .theme-dark &#{$sel} {
              background-color: $lightColor;
          }
        }
    }

    
}
</style>

<script>
import Vue from 'vue';

export default Vue.extend({
  props: {
    solvers: Object,
    titleText: String,
    mask: {
        type: Number,
        default: 0xFFFFFFFF
    }
  },
  computed: {
    items() {
        const items = [];
        for (let [k, props] of Object.entries(this.solvers)) {
            if (this.mask & (1 << props.solverid)) {
                items.push({
                    solverid: props.solverid,
                    name: props.name
                });
            }
        }
        return items;
    }
  },
  data() {
    return {
      bundler: "Parcel",
      // items: [{
      //   solverid: 0,
      //   name: "R"
      // },
      // {
      //   solverid: 1,
      //   name: "A"
      // },
      // {
      //   solverid: 3,
      //   name: "Stef"
      // },
      // {
      //   solverid: 4,
      //   name: "DaveMc"
      // }]
    };
  },
});
</script>