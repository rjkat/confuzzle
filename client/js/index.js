import {AnagrindClient} from './client.js'
import {CrosswordDisplay} from './display.js'
import {SolverDisplay} from './solvers.js'
import {ErrorDisplay} from './errors.js'
import * as DragDrop from './dragdrop.js'
import * as LibPuz from './libpuz.js'
import {TLN} from './tln.js';

const parser = require('./parser.js');

const { HtmlReporter, EnoError } = require('enolib');

class AnagrindApp {
    constructor() {
        const self = this;

        this.client = new AnagrindClient(this, window.location.host);
        this.gridContainer = document.querySelector('.crossword-display');
        this.clueContainer = document.querySelector('.crossword-clue-panel');

        this.panelContainer = document.querySelector('.crossword-panels');

        this.TLN = new TLN();
        this.sourceTextArea = document.getElementById('crossword-source');
        this.TLN.append_line_numbers('crossword-source');
        this.errorDisplay = new ErrorDisplay(
            document.querySelector('#errors-tab'),
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
        this.renderButton = document.getElementById('render-button');

        this.renderButton.onclick = () => self.renderCrossword();

        const pathParts = window.location.pathname.split('/');
        if (pathParts.length > 2 && pathParts[1] == 'grid') {
            this.gridid = pathParts[2];
        }

        if (!this.gridid) {
            this.selectTab('compile');
        } else {
            document.querySelector('#compile-tab').classList.add('hidden');
            document.querySelector('#solve-tab').classList.add('hidden');
            document.querySelector('#join-text').textContent = '2. Join the crossword';
        }
        this.nameDiv = document.querySelector('.crossword-enter-name');
        this.nameInput = document.querySelector('.crossword-name-input');
        this.nameInput.onkeyup = e => self.nameEntered(e);

        this.shareDiv = document.querySelector('.crossword-share-link');
        this.linkText = document.querySelector('.crossword-link-text');
        this.colludeButton = document.querySelector('#collude-button');
        this.colludeButton.value = this.gridid ? 'Join' : 'Share';
        this.colludeButton.onclick = () => self.colludeClicked();

        const copyButton = document.querySelector('#copy-link-button');
        copyButton.onclick = () => {
            navigator.clipboard.writeText(self.linkText.textContent);
        }

        const dropArea = document.getElementById('drop-area');
        const puzFile = document.getElementById('selected-puz-file');

        DragDrop.setupDropArea(dropArea, puzFile, buffer => self.puzFileUploaded(buffer));
        
        if (!this.gridid) {
            this.setCrosswordSource(parser.sampleCrossword());
        } else {
            this.setCrosswordSource(parser.blankCrossword());
        }
    }

    puzFileUploaded(buffer) {
        const eno = LibPuz.loadPuzBuffer(buffer);
        this.setCrosswordSource(eno);
    }

    solversChanged(msg) {
        this.solvers.solversChanged(msg);
    }

    gridJoined(msg) {
        this.selectTab('solve');
        this.panelContainer.dataset.solverid = msg.solverid;
        this.linkText.textContent = window.location.host + '/grid/' + msg.gridid;
        document.querySelector('.crossword-enter-name').classList.add('hidden');
        document.querySelector('.crossword-share-link').classList.remove('hidden');
        document.querySelector('#solve-tab').classList.remove('hidden');
        this.solvers.solversChanged(msg.solvers);
        this.solvers.show();
    }

    shareSucceeded(msg) {
        console.log('share success: ' + msg.gridid);
        this.linkText.textContent = window.location.host + '/grid/' + msg.gridid;
        this.nameDiv.classList.add('hidden');
        this.shareDiv.classList.remove('hidden');
        document.querySelector('#compile-tab').classList.add('hidden');
        this.renderCrossword();
        
        this.solvers.solversChanged(msg.solvers);
        this.solvers.show();
    }

    nameEntered(e) {    
        document.querySelector('#name-length').textContent = this.nameInput.value.length;
        this.colludeButton.disabled = !this.nameInput.value.length;
    }

    selectTab(tabName) {
        document.getElementById(tabName + '-tab').click();
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
        this.TLN.remove_line_numbers('crossword-source');
        this.TLN.append_line_numbers('crossword-source');
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
            let el = document.getElementById('crossword-' + x);
            el.textContent = x == 'author' ? 'by ' : '';
            el.textContent += val ? val : '';
        });

        this.display.setCrossword(crossword);

        // yuck
        this.solvers.grid = this.display.grid;
        document.querySelector('.crossword-solvers').style.left = this.panelContainer.offsetLeft + 'px';
    }

    colludeClicked() {
        const self = this;
        if (this.gridid) {
            this.nameDiv.disabled = true;
            this.client.joinGrid(this.gridid, this.nameInput.value, function (msg) {
                self.gridJoined(msg);
            });
        } else {
            this.client.shareCrossword(this.sourceTextArea.value, this.nameInput.value, function (msg) {
                self.shareSucceeded(msg);
            });
        }
    }
}

const app = new AnagrindApp();





