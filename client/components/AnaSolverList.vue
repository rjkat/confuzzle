<template>
    <ul>
        <li class="solvers-text">SOLVERS</li>
        <li v-for="item in items" class="highlighted" :data-solver-mask="(1 << item.solverid)">
            {{item.name[0]}}<ui-tooltip class="solver-tooltip">{{item.name}}</ui-tooltip>
        </li>
    </ul>
</template>

<style lang="scss" scoped>
@import '../stylesheets/solvers';
.solver-tooltip {
    font-family: $answerFontFamily;
    font-size: $gridFontSize;   
    text-transform: uppercase;     
}
ul {
    vertical-align: middle;
    list-style-type: none;
    background-color: #fff;
    margin: 0;
    padding: 0;
    display: flex;
    li {
        display: flex;
        align-items: center;
    }
    li.solvers-text {
        font-family: $clueFontFamily;
        margin-left: 0.5em;
        padding-right: $displayPadding;
        border-right: 1px solid #000;
        font-weight: bold;
    }

    li.highlighted {
        font-family: $answerFontFamily;
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
        box-sizing: content-box;
        border-right: 1px solid #000;
        border-top: 1px solid #000;
        border-bottom: 1px solid #000;
        cursor: pointer;
    }

    @include each-solver using ($color, $lightColor, $sel) {
        li.highlighted#{$sel} {
            background-color: $color;
        }
    }
}
</style>

<script>
import Vue from 'vue';

export default Vue.extend({
  props: {
    solvers: Object
  },
  computed: {
    items() {
        const items = [];
        for (let [k, props] of Object.entries(this.solvers)) {
            items.push({
                solverid: props.solverid,
                name: props.name
            });
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