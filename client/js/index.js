import {AnagrindClient} from './client.js'
import {CrosswordDisplay} from './display.js'
import {SolverDisplay} from './solvers.js'
import {ErrorDisplay} from './errors.js'
import * as DragDrop from './dragdrop.js'
import {readEno, enoToPuz} from './eno.js'

require('typeface-bree-serif');

const parser = require('./parser.js');

class AnagrindApp {
    constructor() {
        const self = this;

        this.client = new AnagrindClient(this, window.location.host);
        this.gridContainer = document.querySelector('#grid-container');
        this.clueContainer = document.querySelector('.crossword-clue-panel');

        this.panelContainer = document.querySelector('.crossword-panels');

        this.sourceTextArea = document.getElementById('crossword-source');
        this.sourceTextArea.onkeyup = function () {
            clearTimeout(self.renderDebounce)
            self.renderDebounce = setTimeout(
               () => self.renderCrossword(self.sourceTextArea.value),
               500
            );
        }

        this.errorDisplay = new ErrorDisplay(
            document.querySelector('#debug-label'),
            document.querySelector('#error-text'),
            document.querySelector('#error-snippet')
        );
        this.display = new CrosswordDisplay(
            {panelContainer: this.panelContainer,
             gridContainer: this.gridContainer,
             clueContainer: this.clueContainer,
             sourceTextArea: this.sourceTextArea},
            {onFillCell: (...args) => self.cellFilled(...args),
             onSelectionChanged: (...args) => self.selectionChanged(...args)}
        );
        this.solvers = new SolverDisplay(
            document.querySelector('.crossword-solvers'),
            this.display.grid
        );
        this.downloadButton = document.getElementById('download-puz-button');
        this.downloadButton.onclick = () => self.downloadClicked();

        const pathParts = window.location.pathname.split('/');
        if (pathParts.length > 2 && (pathParts[1] == 'grid' || pathParts[1] == 'd')) {
            this.gridid = pathParts[2];
        }

        this.downloadButton.onclick = () => self.downloadClicked();

        
        this.nameDiv = document.querySelector('#collude-enter-name');
        this.nameInput = document.querySelector('#collude-name-input');
        this.nameInput.onkeyup = e => self.nameEntered(
            e, document.querySelector('#collude-name-length'), document.querySelector('#collude-button')
        );

        if (!this.gridid) {
            this.nameDiv.classList.remove('hidden');
            this.selectTab('compile');
        } else {
            location.hash = 'join';
            document.querySelector('#compile-tab-label').classList.add('hidden');
            document.querySelector('#solve-tab-label').classList.add('hidden');
        }

        this.joinInput = document.querySelector('#join-name-input');
        this.joinInput.onkeyup = e => self.nameEntered(
            e, document.querySelector('#join-name-length'), document.querySelector('#join-button')
        );

        this.shareDiv = document.querySelector('.crossword-share-link');
        this.linkText = document.querySelector('.crossword-link-text');
        this.colludeButton = document.querySelector('#collude-button');
        this.colludeButton.onclick = () => self.colludeClicked();

        this.joinButton = document.querySelector('#join-button');
        this.joinButton.onclick = () => self.joinClicked();

        const copyButton = document.querySelector('#copy-link-button');
        copyButton.onclick = () => {
            navigator.clipboard.writeText(self.linkText.textContent);
        }

        const dropArea = document.getElementById('drop-area');
        const puzFile = document.getElementById('selected-puz-file');

        DragDrop.setupDropArea(dropArea, puzFile, buf => self.puzFileUploaded(buf));
        
        this.setCrosswordSource(parser.sampleCrossword());
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
        this.selectTab('solve');
        this.panelContainer.dataset.solverid = msg.solverid;
        this.linkText.textContent = 'https://anagr.in/d/' + msg.gridid;
        document.querySelector('#join').classList.add('hidden');
        // remove #join from URL
        history.replaceState(null, null, ' ');
        document.querySelector('.crossword-share-link').classList.remove('hidden');
        document.querySelector('#solve-tab-label').classList.remove('hidden');
        this.solvers.solversChanged(msg.solvers);
        this.solvers.show();
    }

    shareSucceeded(msg) {
        console.log('share success: ' + msg.gridid);
        this.linkText.textContent = 'https://anagr.in/d/' + msg.gridid;
        this.nameDiv.classList.add('hidden');
        this.shareDiv.classList.remove('hidden');
        document.querySelector('#compile-tab-label').classList.add('hidden');
        this.renderCrossword();
        
        this.solvers.solversChanged(msg.solvers);
        this.solvers.show();
    }

    nameEntered(el, nameLength, button) {
        const name = el.target.value;
        nameLength.textContent = name.length;
        button.disabled = !name.length;
    }

    selectTab(tabGroup, tabName) {
        const tab = document.getElementById(tabName + '-tab');
        if (!tab)
            return;

        document.querySelectorAll('.' + tabGroup + '-panel').forEach(el => {
            el.classList.add('hidden');
        });
        document.getElementById(tabName + '-panel').classList.remove('hidden');

        tab.parentElement.childNodes.forEach(el => {
            if (el.nodeName == 'LI')
                el.classList.remove('selected');
        });
        tab.classList.add('selected');
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
        this.sourceTextArea.value = source;
        this.sourceTextArea.dispatchEvent(new Event('input'));
        this.renderCrossword(source);
    }

    renderCrossword(source) {
        if (!source){
            source = this.sourceTextArea.value;
        }

        let crossword;
        try {
            crossword = parser.parse(source);
        } catch(err) {
            this.errorDisplay.showError(err);
            return;
        }
        this.errorDisplay.clearError();
        ['type', 'author', 'identifier'].forEach(x => {
            let val = crossword.meta[x];
            let el = document.getElementById('crossword-meta-' + x);
            el.textContent = x == 'author' ? 'by ' : '';
            el.textContent += val ? val : '';
        });

        this.display.setCrossword(crossword);

        // yuck
        this.solvers.grid = this.display.grid;
    }

    joinClicked() {
        const self = this;
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
