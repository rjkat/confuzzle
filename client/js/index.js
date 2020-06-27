import {AnagrindClient} from './client.js'
import {CrosswordDisplay} from './display.js'
import {SolverDisplay} from './solvers.js'
import {ErrorDisplay} from './errors.js'
import * as DragDrop from './dragdrop.js'
import {readEno, enoToPuz} from './eno.js'

import Vue from 'vue';
import 'keen-ui/dist/keen-ui.css';
import App from '../App.vue'

require('../stylesheets/main.scss');

const parser = require('./parser.js');

class AnagrindApp {
    constructor() {
        const self = this;

        this.client = new AnagrindClient(this, window.location.host);
        this.gridContainer = document.querySelector('#grid-container');

        // this.panelContainer = document.querySelector('.crossword-panels');

        // this.errorDisplay = new ErrorDisplay(
        //     document.querySelector('#debug-label'),
        //     document.querySelector('#error-text'),
        //     document.querySelector('#error-snippet')
        // );
        this.display = new CrosswordDisplay(
            {panelContainer: this.panelContainer,
             gridContainer: this.gridContainer},
            {onFillCell: (...args) => self.cellFilled(...args),
             onSelectionChanged: (...args) => self.selectionChanged(...args)}
        );
        this.solvers = new SolverDisplay(
            document.querySelector('.crossword-solvers'),
            this.display.grid
        );

        const pathParts = window.location.pathname.split('/');
        if (pathParts.length > 2 && (pathParts[1] == 'grid' || pathParts[1] == 'd')) {
            this.gridid = pathParts[2];
        }

        if (!this.gridid) {
            this.showMain();
        } else {
            location.hash = 'join';
        }

        // DragDrop.setupDropArea(dropArea, puzFile, buf => self.puzFileUploaded(buf));
        
        if (!this.gridid) {
            this.setCrosswordSource(parser.sampleCrossword());
        }
    }

    puzFileUploaded(buf) {
        const eno = readEno(new Uint8Array(buf));
        this.setCrosswordSource(eno);
    }

    downloadClicked() {
        const puz = enoToPuz(this.sourceTextArea.value);
        const puzbytes = puz.toBytes();
        const blob = new Blob([puzbytes], {type: "application/x-crossword"});
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        const filename = this.display.crossword.meta.name + '.puz';
        link.download = filename;
        link.click();
    }

    solversChanged(msg) {
        this.solvers.solversChanged(msg);
    }

    gridJoined(msg) {
        // this.panelContainer.dataset.solverid = msg.solverid;
        this.linkText.textContent = 'https://anagr.in/d/' + msg.gridid;
        // remove #join from URL
        history.replaceState(null, null, ' ');
        document.querySelector('.crossword-share-link').classList.remove('hidden');
        document.querySelector('#solve-tab-label').classList.remove('hidden');
        this.solvers.solversChanged(msg.solvers);
        this.solvers.show();
    }

    shareSucceeded(msg) {
        this.linkText.textContent = 'https://anagr.in/d/' + msg.gridid;
        this.nameDiv.classList.add('hidden');
        this.shareDiv.classList.remove('hidden');
        this.renderCrossword();

        // replace url in url bar with the link to the grid
        window.history.replaceState(null, 'anagrind.com', '/grid/' + msg.gridid);
        
        this.solvers.solversChanged(msg.solvers);
        this.solvers.show();
    }

    nameEntered(el, nameLength, button) {
        const name = el.target.value;
        nameLength.textContent = name.length;
        button.disabled = !name.length;
    }

    cellFilled(solverid, clueid, offset, value) {
        this.client.sendUpdate({
            action: 'fillCell',
            solverid: solverid,
            clueid: clueid,
            offset: offset,
            value: value
        });
    }

    selectionChanged(selected, solverid, clueid) {
        if (!clueid) {
            return;
        }
        this.client.sendUpdate({
            action: 'selectionChanged',
            selected: selected,
            solverid: solverid,
            clueid: clueid
        });
    }

    setCrosswordSource(source) {
    }

    // renderCrossword(source, compiling) {
    //     if (!source){
    //         source = this.sourceTextArea.value;
    //     }

    //     let crossword;
    //     try {
    //         crossword = parser.parse(source, compiling);
    //     } catch(err) {
    //         this.errorDisplay.showError(err);
    //         return;
    //     }
    //     this.errorDisplay.clearError();
    //     ['name', 'author', 'identifier'].forEach(x => {
    //         let val = crossword.meta[x];
    //         let el = document.getElementById('crossword-meta-' + x);
    //         el.textContent = x == 'author' ? 'by ' : '';
    //         el.textContent += val ? val : '';
    //     });

    //     this.display.setCrossword(crossword);

    //     // yuck
    //     this.solvers.grid = this.display.grid;

    //     document.getElementById('join').classList.add('hidden');
    // }

    showMain() {
        document.body.style.backgroundColor = "#F0F8FF";
        document.getElementById('main').classList.remove('hidden');
    }

    joinClicked() {
        const self = this;

        this.showMain();
        this.nameDiv.disabled = true;
        this.client.joinGrid(this.gridid, this.joinInput.value, function (msg) {
            self.gridJoined(msg);
        });
    }

    colludeClicked() {
        const self = this;
        this.client.shareCrossword(this.sourceTextArea.value, this.nameInput.value, function (msg) {
            self.shareSucceeded(msg);
        });
    }
}

const app = new AnagrindApp();

const vm = new App({
    el: '#app',
    cwDisplay: app.display
});
