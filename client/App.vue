<template>
    <ui-tabs type="icon-and-text">
        <ui-tab>
            <div slot="header" class="ana-tab-header">
                <ui-icon slot="icon" icon="extension"></ui-icon>
                <span>Solve</span>
            </div>
            <ana-solve :crossword="crossword"></ana-solve>
        </ui-tab>
        <ui-tab>
            <div slot="header" class="ana-tab-header">
                <ui-icon slot="icon" icon="build"></ui-icon>
                <span>Compile</span>
            </div>
            <ana-compile></ana-compile>
        </ui-tab>
        <ui-tab>
            <div slot="header" class="ana-tab-header">
                <ui-icon slot="icon" icon="people"></ui-icon>
                <span>Collude</span>
            </div>
            <ana-collude></ana-collude>
        </ui-tab>
    </ui-tabs>
</template>

<script>
import Vue from "vue";
import { UiIcon, UiTab, UiTabs } from 'keen-ui';
import AnaCompile from './components/AnaCompile.vue'
import AnaCollude from './components/AnaCollude.vue'
import AnaSolve from './components/AnaSolve.vue'

const parser = require('./js/parser.js');

export default Vue.extend({
  components: {
    AnaCompile,
    AnaCollude,
    AnaSolve,
    UiIcon,
    UiTab,
    UiTabs
  },
  props: {
    gridid: String,
    grid: Object,
    solverid: Number,
    solvers: Object,
    compiling: Boolean,
    crosswordSource: {
        type: String,
        default: parser.sampleCrossword()
    }
  },
  computed: {
    crossword() {
        return parser.parse(this.crosswordSource, this.compiling);
    }
  },
  data() {
    return {
      bundler: "Parcel"
    };
  },
  methods: {
    // remote solver has changed their selection
    selectionChanged(msg) {
        if (msg.selected) {
            this.grid.highlightClue(msg.clueid, msg.solverid);
        } else {
            this.grid.clearHighlightClue(msg.clueid, msg.solverid);
        }
    },
    fillCell(clueid, offset, value, forced) {
        const self = this;
        function fill(clueid, offset) {
            let els = document.querySelectorAll(
                '[data-clueid*="'+ clueid +'"][data-offset*="' + offset + '"]'
            );
            els.forEach(function (el) {
                if (!matchesClueId(el, clueid, offset)) {
                    return;
                }
                if (el.nodeName == 'INPUT') {
                    el.value = value;
                } else if (el.nodeName == 'TD') {
                    el.firstChild.textContent = value;
                }
            });
        }
        const clue = this.crossword.clues[clueid];
        const cell = clue.cells[offset];
        cell.contents = value;
        fill(clueid, offset);
        if (clue.intersections) {
            const intersection = clue.intersections[offset];
            if (intersection) {
                fill(intersection.clueid, intersection.offset);
            }
        }
        if (!forced) {
            this.client.sendUpdate({
                action: 'fillCell',
                solverid: this.solverid,
                clueid: clueid,
                offset: offset,
                value: value
            });
        }
    },
    gridJoined(msg) {
        this.solverid = msg.solverid;
        this.gridid = msg.gridid;
        this.solvers = msg.solvers;
        // remove #join from URL
        history.replaceState(null, null, ' ');
    },
    joinClicked(name) {
        const self = this;
        this.client.joinGrid(this.gridid, name, function (msg) {
            self.gridJoined(msg);
        });
    },
    colludeClicked(name) {
        const self = this;
        this.client.shareCrossword(this.crosswordSource, name, function (msg) {
            self.shareSucceeded(msg);
        });
    },
    puzFileUploaded(buf) {
        this.crosswordSource = readEno(new Uint8Array(buf));
    },
    downloadClicked() {
        const puz = enoToPuz(this.crosswordSource);
        const puzbytes = puz.toBytes();
        const blob = new Blob([puzbytes], {type: "application/x-crossword"});
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        const filename = this.crossword.meta.name + '.puz';
        link.download = filename;
        link.click();
    }
  }
});
</script>

<style lang="scss">
    @import "./stylesheets/_variables.scss";
    .ui-tab-header-item--type-icon-and-text {
        height: 2.5rem;
    }
    .ana-tab-header {
        font-family: $clueFontFamily;
        text-transform: none;
        display: flex;
        .ui-icon {
            margin-right: 8px;
        }
    }
</style>