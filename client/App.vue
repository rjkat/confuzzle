<template>
<div>
    <ui-toolbar type="colored" removeNavIcon>
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
                @click="openModal('shareModal')"
            >
            </ui-icon-button>
            <ana-share-modal ref="shareModal"></ana-share-modal>
            <ui-icon-button
                color="white"
                has-dropdown
                icon="more_vert"
                ref="menuDropdown"
                size="large"
            >
                <ui-menu
                    contain-focus
                    has-icons
                    slot="dropdown"
                    :options="menuOptions"
                    @select="selectMenuOption($event)"
                    @close="$refs.menuDropdown.closeDropdown()"
                ></ui-menu>
            </ui-icon-button>
        </div>
    </ui-toolbar>
    <div class="content">
        <div id="grid-container">
            <div>
                <ana-crossword-grid v-model="crossword" id="grid"></ana-crossword-grid>
            </div>
            <ana-crossword-editor v-model="crosswordSource" id="editor" v-if="compiling"></ana-crossword-editor>
            <ana-crossword-clues v-model="crossword" id="clues" v-else></ana-crossword-clues>
        </div>
    </div>
</div>
</template>

<style lang="scss">

.ui-toolbar--type-colored {
    background-color: $titleBgColor !important;

    .ui-toolbar__body {
        color: white !important;
    }
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
    height: 100%;
}

#editor {
    max-height: 30em;
    overflow-x: scroll;
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

import AnaCrosswordClues from './components/AnaCrosswordClues.vue'
import AnaCrosswordGrid from './components/AnaCrosswordGrid.vue'
import AnaCrosswordEditor from './components/AnaCrosswordEditor.vue'
import AnaShareModal from './components/AnaShareModal.vue'

const parser = require('./js/parser.js');
import {readEno, enoToPuz} from './js/eno.js'

export default Vue.extend({
  components: {
    AnaCrosswordClues,
    AnaCrosswordGrid,
    AnaCrosswordEditor,
    AnaShareModal
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
    },
    menuOptions() {
        if (!this.compiling) {
            return [{
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
            }];
        } else {
            return [{
                label: 'Preview',
                icon: 'visibility'
            },
            {
                label: 'Download',
                icon: 'get_app'
            },
            {
                label: 'About',
                icon: 'info'
            }];
        }
    }
  },
  data() {
    return {
      bundler: "Parcel"
    };
  },
  methods: {
    openModal(ref) {
        this.$refs[ref].open();
    },
    closeModal(ref) {
        this.$refs[ref].close();
    },
    selectMenuOption(option) {
        if (option.label == 'Edit' || option.label == 'Preview') {
            this.compiling = !this.compiling;
        } else if (option.label == 'Download') {
            this.downloadClicked();
        }
    },
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