import {AnagrindClient} from './client.js'
import {CrosswordDisplay} from './display.js'
import {SolverDisplay} from './solvers.js'

const parser = require('./parser.js');

class AnagrindApp {
    constructor() {
        const self = this;

        this.client = new AnagrindClient(this, window.location.host);
        this.gridContainer = document.querySelector('.crossword-display');
        this.panelContainer = document.querySelector('.crossword-panels');
        this.cluePanel = document.querySelector('.crossword-clue-panel');
        this.sourceEl = document.getElementById('crossword-source');
        
        this.display = new CrosswordDisplay(
            this.panelContainer,
            this.gridContainer,
            this.cluePanel,
            this.sourceEl,
            (clueid, offset, value) => this.cellFilled(clueid, offset, value)
        );
        this.solvers = new SolverDisplay(document.querySelector('.crossword-solvers'));
        this.renderButton = document.getElementById('render-button');
        this.sourceEl.value = parser.sampleCrossword();

        this.renderButton.onclick = () => self.renderCrossword();

        const pathParts = window.location.pathname.split("/");
        if (pathParts.length > 2 && pathParts[1] == "grid") {
            this.gridId = pathParts[2];
        }

        if (!this.gridId) {
            this.selectTab('compile');
        }
        this.nameDiv = document.querySelector('.crossword-enter-name');
        this.nameInput = document.querySelector('.crossword-name-input');
        this.nameInput.onkeyup = () => self.nameEntered();

        this.shareDiv = document.querySelector('.crossword-share-link');
        this.linkText = document.querySelector('.crossword-link-text');
        this.colludeButton = document.querySelector('#collude-button');
        this.colludeButton.value = this.gridId ? 'Join' : 'Share';
        this.colludeButton.onclick = () => self.colludeClicked();

        const copyButton = document.querySelector('#copy-link-button');
        copyButton.onclick = () => {
            console.log("button clicked " + self.linkText.textContent);
            navigator.clipboard.writeText(self.linkText.textContent);
        }
        this.renderCrossword();
    }

    solversChanged(msg) {
        this.solvers.solversChanged(msg);
    }

    gridJoined(msg) {
        this.selectTab('solve');
        this.gridContainer.dataset.solverid = msg.color;
        this.panelContainer.dataset.solverid = msg.color;
        this.solvers.solversChanged(msg.solvers);
        this.solvers.show();
    }

    shareSucceeded(msg) {
        console.log("share success: " + msg.gridId);
        this.linkText.textContent = window.location.host + '/grid/' + msg.gridId;
        this.nameDiv.classList.add('hidden');
        this.shareDiv.classList.remove('hidden');
        this.renderCrossword();
        this.gridContainer.dataset.solverid = msg.color;
        this.panelContainer.dataset.solverid = msg.color;
        this.solvers.solversChanged(msg.solvers);
        this.solvers.show();
    }

    nameEntered() {
        document.querySelector('#name-length').textContent = this.nameInput.value.length;
        this.colludeButton.disabled = !this.nameInput.value.length;
    }

    selectTab(tabName) {
        document.getElementById(tabName + '-tab').click();
    }

    cellFilled(clueid, offset, value) {
        this.client.sendUpdate({action: 'fillCell', clueid: clueid, offset: offset, value: value});
    }

    renderCrossword() {
        const crossword = parser.parse(this.sourceEl.value);

        ['author', 'pubdate'].forEach(x => {
            let el = document.getElementById('crossword-' + x);
            el.textContent = x == 'author' ? 'by ' : '';
            el.textContent += crossword.meta[x];
        });

        this.display.setCrossword(crossword);

        // yuck
        document.querySelector('.crossword-solvers').style.left = this.panelContainer.offsetLeft + 'px';
    }

    colludeClicked() {
        const self = this;
        if (this.gridId) {
            this.nameDiv.disabled = true;
            this.client.joinGrid(this.gridId, this.nameInput.value, function (msg) {
                self.gridJoined(msg);
            });
        } else {
            this.client.shareCrossword(this.sourceEl.value, this.nameInput.value, function (msg) {
                self.shareSucceeded(msg);
            });
        }
    }
}

const app = new AnagrindApp();





