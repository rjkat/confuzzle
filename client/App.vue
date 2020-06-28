<template>
<div>
    <ui-toolbar type="colored" text-color="white" :title="crossword.meta.name" removeNavIcon></ui-toolbar>
    <div class="content" id="app">
        <div id="grid-container">
            <ana-cell-grid :crossword="crossword" id="grid"></ana-cell-grid>
            <ana-solve :crossword="crossword" id="clues"></ana-solve>
        </div>
        <div>
            <ui-tabs type="icon-and-text">
                <ui-tab>
                    <div slot="header" class="ana-tab-header">
                        <ui-icon slot="icon" icon="extension"></ui-icon>
                        <span>Solve</span>
                    </div>
                </ui-tab>
                <ui-tab>
                    <div slot="header" class="ana-tab-header">
                        <ui-icon slot="icon" icon="build"></ui-icon>
                        <span>Compile</span>
                    </div>
                    <ana-compile :crossword-source="crosswordSource"></ana-compile>
                </ui-tab>
                <ui-tab>
                    <div slot="header" class="ana-tab-header">
                        <ui-icon slot="icon" icon="people"></ui-icon>
                        <span>Collude</span>
                    </div>
                    <ana-collude></ana-collude>
                </ui-tab>
            </ui-tabs>
        </div>
    </div>
</div>
</template>

<style lang="scss">

.ui-toolbar__title {
    font-family: $titleFontFamily;
}

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
#grid-container {
    display: flex;
    justify-content: flex-start;
    width: 100%;
    height: 100%;
}
#grid {
    flex: none;
    margin-right: $displayPadding;
}
#clues {
    margin-top: $displayPadding;
}
</style>

<script>

import Vue from 'vue';

import 'keen-ui/src/bootstrap';
import KeenUI from 'keen-ui/src';

Vue.use(KeenUI);

import AnaCellGrid from './components/AnaCellGrid.vue'
import AnaCompile from './components/AnaCompile.vue'
import AnaCollude from './components/AnaCollude.vue'
import AnaSolve from './components/AnaSolve.vue'

const parser = require('./js/parser.js');
import {readEno, enoToPuz} from './js/eno.js'


export default Vue.extend({
  components: {
    AnaCellGrid,
    AnaCompile,
    AnaCollude,
    AnaSolve
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
      menuOptions: [
        {
            label: 'Settings'
        },
        {
            label: 'About'
        },
        {
            label: 'Help'
        }
      ],
      bundler: "Parcel"
    };
  },
  methods: {
    isSelected(clueid) {
        if (clueid == this.selectedid) {
            return true;
        }
        const refs = this.crossword.clues[clueid].refIds;
        if (refs) {
            for (var i = 0; i < refs.length; i++) {
                if (refs[i] == this.selectedid) {
                    return true;
                }
            }
        }
        return false;
    },
    clearOwnHighlight(clueid, force) {
        if (!clueid) {
            return;
        }
        if (force || !this.isSelected(clueid)) {
            // this.clues.clearHighlightClue(clueid);
            this.grid.clearHighlightClue(clueid, this.solverid);
        }
    },
    drawOwnHighlight(clueid, scroll) {
        if (!clueid) {
            return
        }
        // this.clues.highlightClue(clueid, scroll);
        this.grid.highlightClue(clueid, this.solverid);
    },
    // remote solver has changed their selection
    selectionChanged(msg) {
        if (msg.selected) {
            this.grid.highlightClue(msg.clueid, msg.solverid);
        } else {
            this.grid.clearHighlightClue(msg.clueid, msg.solverid);
        }
    },
    // local solver has changed their selection
    selectClue(clueid, scroll) {
        this.callbacks.onSelectionChanged(false, this.solverid, this.selectedid);
        this.clearOwnHighlight(this.selectedid, true);
        this.selectedid = clueid;
        this.drawOwnHighlight(this.selectedid, scroll);
        this.callbacks.onSelectionChanged(true, this.solverid, this.selectedid);
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