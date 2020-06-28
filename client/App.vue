<template>
<div>
    <ui-toolbar type="colored" text-color="white" removeNavIcon>
        <template v-slot="title">
            <span style="{display: inline-flex; align-items: center;}">
                <span class="crossword-meta-name">{{crossword.meta.name}}</span>
                <span class="crossword-meta-author">by {{crossword.meta.author}}</span>
                <span class="crossword-meta-identifier" v-if="crossword.meta.identifier">{{crossword.meta.identifier}}</span>
            </span>
        </template>
        <div slot="actions">
            <ui-icon-button
                color="white"
                has-dropdown
                icon="publish"
                size="large"
            >
            </ui-icon-button>
            <ui-icon-button
                color="white"
                has-dropdown
                icon="share"
                size="large"
            >
            </ui-icon-button>
            <ui-icon-button
                color="white"
                has-dropdown
                icon="more_vert"
                ref="dropdownButton1"
                size="large"
            >
                <ui-menu
                    contain-focus
                    has-icons
                    slot="dropdown"
                    :options="menuOptions"
                    @close="$refs.dropdownButton1.closeDropdown()"
                ></ui-menu>
            </ui-icon-button>
        </div>
    </ui-toolbar>
    <div class="content">
        <div id="grid-container">
            <div>
                <ana-cell-grid :crossword="crossword" id="grid"></ana-cell-grid>
            </div>
            <ana-compile :crossword-source="crosswordSource" id="editor" v-if="compiling"></ana-compile>
            <ana-solve :crossword="crossword" id="clues" v-else></ana-solve>
        </div>
    </div>
</div>
</template>

<style lang="scss">

.ui-toolbar--type-colored {
    background-color: $titleBgColor !important;
}

.crossword-meta-name {
    text-transform: uppercase;
    font-family: $titleFontFamily;
    font-weight: bold;
}
.crossword-meta-author {
    font-family: $clueFontFamily; 
    margin-left: .5em;
    margin-right: .5em;
    font-size: 16px;
}
.crossword-meta-identifier {
    font-family: $titleFontFamily;
}
#grid-container {
    display: flex;
    justify-content: flex-start;
    width: 100%;
    height: 100%;
}
#grid {
    flex: none;
}
#clues {
    margin-left: $displayPadding;
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

const menuOptions = [
    {
        label: 'Edit',
        icon: 'edit'
    },
    {
        label: 'Download',
        icon: 'get_app'
    },
    {
        label: 'About',
        icon: 'info'
    }
];

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
    compiling: {
        type: Boolean,
        default: false
    },
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
      menuOptions: menuOptions,
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