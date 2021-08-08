<template>
    <div class="solvers-list" :data-title-text="titleText">
        <div class="solver-info-text" v-if="titleText"></div>
        <div class="solvers-list-item highlighted" v-for="(solver, index) in solvers.filter(s => mask & (1 << s.solverid))" :key="index" :data-multi-solver-mask="solver.syncMask" @click.prevent="solverClicked(solver)">
            <div class="solver-name">{{solver.name[0]}}</div><ui-tooltip class="solver-tooltip"><div class="solver-tooltip-name">{{solver.name}}</div><div class="solver-following-text">{{solver.solverid == solverid ? '[you]' : (solver.syncSelection ? '[following]' : '[tap to follow]')}}</div></ui-tooltip>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import '../stylesheets/solvers';
.solver-tooltip {
    font-family: $clueFontFamily;
    display: flex;
    align-items: center;
}
.solver-tooltip-name {
    font-family: $answerFontFamily;
    font-size: $gridFontSize;   
    text-transform: uppercase;
}
.solver-following-text {
    margin-left: .5em;   
}
.solver-name {
    height: 100%;
    width: 100%;
    margin: auto;
    line-height: 100%;
    user-select: none;
    text-align: center;
}

.solver-info-text {
    font-family: $clueFontFamily;
    margin-left: 0.5em;
    padding-right: $displayPadding;
    &:before {
        content: 'SOLVERS';
        font-family: $titleFontFamily;
        font-size: 16px;
        padding-right: .5em;
    }
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
        width: $gridCellSize;
        height: $gridCellSize;
        max-height: $gridCellSize;
        line-height: 1ch;
        position: relative;
        justify-content: center;
        text-transform: uppercase;
        border: 1px solid #000;
        margin-right: -2px;
        cursor: pointer;
        box-sizing: border-box;
    }

    
}
</style>

<script>
import Vue from 'vue';

export default Vue.extend({
  props: {
    solverid: Number,
    solvers: Array,
    titleText: Boolean,
    mask: {
        type: Number,
        default: 0xFFFFFFFF
    }
  },
  methods: {
    solverClicked(solver) {
        this.$emit('solver-clicked', solver);
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