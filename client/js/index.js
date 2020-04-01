import {AnagrindClient} from './client.js'
import {CrosswordDisplay} from './display.js'

const parser = require('./parser.js');

const gridName = window.location.pathname.split("/").pop();
const client = new AnagrindClient(window.location.host, gridName);

function onfillcell(clueid, offset, value) {
    client.sendUpdate({action: 'fillCell', clueid: clueid, offset: offset, value: value});
}

const gridContainer = document.querySelector('.crossword-display');
const panelContainer = document.querySelector('.crossword-panels');
const cluePanel = document.querySelector('.crossword-clue-panel');
const display = new CrosswordDisplay(panelContainer, gridContainer, cluePanel, onfillcell);
client.display = display;

const sourceEl = document.getElementById('crossword-source');
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

renderButton.click();
