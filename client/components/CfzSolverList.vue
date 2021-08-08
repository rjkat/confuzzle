<template>
    <div class="solvers-list" :data-title-text="titleText">
        <div class="solvers-list-item solvers-text" v-if="titleText">{{titleText}}</div>
        <div class="solvers-list-item highlighted" v-for="item in items" :data-solver-mask="(1 << (item.solverid % 8))">
            <div class="solver-name">{{item.name[0]}}</div><ui-tooltip class="solver-tooltip"><span class="solver-tooltip-name">{{item.name}}</span></ui-tooltip>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import '../stylesheets/solvers';
.solver-tooltip {
    font-family: $clueFontFamily;
}
.solver-tooltip-name {
    font-family: $answerFontFamily;
    font-size: $gridFontSize;   
    text-transform: uppercase;     
}
.solver-name {
    height: 100%;
    width: 100%;
    margin: auto;
    line-height: 100%;
    text-align: center;
}
.solvers-list {
    display: inline-flex;
    vertical-align: middle;
    align-items: center;
    &[data-title-text] {
        display: flex;
        margin: 0;
        padding: 0;
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
        margin-left: -2px;
        padding-right: 1px;
        cursor: pointer;
        box-sizing: border-box;

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
    clickToLock: Boolean,
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