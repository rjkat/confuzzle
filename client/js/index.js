import {AnagrindClient} from './client.js'
import {CrosswordDisplay} from './display.js'
import {SolverDisplay} from './solvers.js'

const parser = require('./parser.js');

const client = new AnagrindClient(window.location.host);
function onfillcell(clueid, offset, value) {
    client.sendUpdate({action: 'fillCell', clueid: clueid, offset: offset, value: value});
}

const gridContainer = document.querySelector('.crossword-display');
const panelContainer = document.querySelector('.crossword-panels');
const cluePanel = document.querySelector('.crossword-clue-panel');
const sourceEl = document.getElementById('crossword-source');

const display = new CrosswordDisplay(panelContainer, gridContainer, cluePanel, sourceEl, onfillcell);
client.display = display;

const solvers = new SolverDisplay(document.querySelector('.crossword-solvers'));

const renderButton = document.getElementById('render-button');
renderButton.onclick = function() {
    const crossword = parser.parse(sourceEl.value);

    ['author', 'pubdate'].forEach(x => {
        let el = document.getElementById('crossword-' + x);
        el.textContent = x == 'author' ? 'by ' : '';
        el.textContent += crossword.meta[x];
    });

    display.setCrossword(crossword);

    // yuck
    document.querySelector('.crossword-solvers').style.left = panelContainer.offsetLeft + 'px';
}
document.getElementById('crossword-source').value = parser.sampleCrossword();

function renderSource() {
    renderButton.click();
}

function gridJoined(msg) {
    document.getElementById('solve-tab').click();
    solvers.show();
}

function shareSuccess(gridId) {
    console.log("share success: " + gridId);
    solvers.show();
}

renderSource();

const pathParts = window.location.pathname.split("/");
let gridId;
if (pathParts.length > 2 && pathParts[1] == "grid") {
    gridId = pathParts[2];
}
const colludeButton = document.querySelector('#collude-button');

colludeButton.value = gridId ? 'Join' : 'Share';

const nameInput = document.querySelector('.crossword-name-input');
nameInput.onkeyup = function () {
    document.querySelector('#name-length').textContent = nameInput.value.length;
    colludeButton.disabled = !nameInput.value.length;
}



colludeButton.onclick = function () {
    if (gridId) {
        client.joinGrid(gridId, nameInput.value, function (msg) {
            gridJoined(msg);
        });
    } else {
        renderSource();
        client.shareCrossword(sourceEl.value, nameInput.value, function (gridId) {
            shareSuccess(gridId);
        });
    }
}




