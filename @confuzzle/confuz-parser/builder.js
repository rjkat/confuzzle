const parser = require('./parser');

function parseAndBuild(input, compiling) {
    const cw = parser.parse(input, compiling);

    cw.meta.copyrightText = '';
    if (cw.meta.copyright.includes('©')) {
      cw.meta.copyrightText = cw.meta.copyright;
    } else if (cw.meta.copyright) {
      cw.meta.copyrightText = '© ' + cw.meta.copyright;
    }
    cw.acrossClueIds = [];
    cw.downClueIds = [];
    let i = 0;
    for (let [clueid, clue] of Object.entries(cw.clues)) {
      
      // populate cell across and down clues for convenience
      for (let cellId of clue.cellIds) {
        const cell = cw.grid.cells[cellId];
        if (cell.clues.acrossId)
            cell.clues.across = cw.clues[cell.clues.acrossId]
        if (cell.clues.downId)
            cell.clues.down = cw.clues[cell.clues.downId]
      }

      clue.refs = [];
      if (clue.primaryId && clue.primaryId != clueid) {
        clue.primary = cw.clues[clue.primaryId];
      }
      clue.idText = clue.numbering.clueText;
      clue.numberText = clue.numbering.clueText;
      clue.refText = '';
      if (clue.refIds.length > 0 && clue.primaryId == clueid) {
        clue.idText = clue.refIds.join(', ');
        clue.refText = clue.refIds.slice(1).join(', ');
      }
      clue.directionText = clue.isAcross ? 'A' : 'D';
      let nextRefId = '';
      for (let i = 0; i < clue.refIds.length; i++) {
        if (clue.refIds[i] != clueid) {
          clue.refs.push(cw.clues[clue.refIds[i]]);
        } else {
          nextRefId = clue.refIds[i + 1];
        }
      }
      clue.nextRef = nextRefId ? cw.clues[nextRefId] : null;

      // populate crossword across and down clues for convenience
      if (clue.isAcross) {
          cw.acrossClueIds.push(clueid);
      } else {
          cw.downClueIds.push(clueid);
      }
      clue.selected = false;
      clue.forcedSelection = false;
      clue.highlightMask = 0;
      clue.showCorrect = false;
      clue.showIncorrect = false;
      clue.index = i;
      i += 1
    }
    const numClues = i;

    cw.acrossClueIds.sort((aid, bid) => {
       const a = cw.clues[aid] ;
       const b = cw.clues[bid] ;
       return a.row != b.row ? a.row - b.row : a.col - b.col;
    });
    cw.downClueIds.sort((aid, bid) => {
       const a = cw.clues[aid] ;
       const b = cw.clues[bid] ;
       return a.row != b.row ? a.row - b.row : a.col - b.col;
    });
    
    let clueIds = [];
    for (const clueid of Object.keys(cw.clues)) {
      clueIds.push(clueid)
    }
    for (let [clueid, clue] of Object.entries(cw.clues)) {
        let i = clue.index;
        const nextIndex = (i + 1) % numClues;
        const otherClueIds = (clue.isAcross ? cw.downClueIds : cw.acrossClueIds);
        const nextClueId = nextIndex == 0 ? otherClueIds : clueIds;
        const prevClues = clue.index == 0 ? otherClueIds : clueIds;
        const prevIndex = i > 0 ? i - 1 : otherClueIds.length - 1;
        clue.nextNumericalClue = nextClueId[nextIndex];
        clue.prevNumericalClue = prevClues[prevIndex];
    }
    return cw;
}

module.exports = {
  parseAndBuild: parseAndBuild
}
