const parser = require('./parser');

function parseAndBuild(input, compiling) {
    const cw = parser.parse(input, compiling);

    cw.meta.copyrightText = '';
    if (cw.meta.copyright.includes('©')) {
      cw.meta.copyrightText = cw.meta.copyright;
    } else if (cw.meta.copyright) {
      cw.meta.copyrightText = '© ' + cw.meta.copyright;
    }
    cw.acrossClues = [];
    cw.downClues = [];
    for (let [clueid, clue] of Object.entries(cw.clues)) {
      
      // populate cell across and down clues for convenience
      for (let cell of clue.cells) {
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
          cw.acrossClues.push(clue);
      } else {
          cw.downClues.push(clue);
      }
      clue.highlightMask = 0;
      clue.selected = false;
      clue.forcedSelection = false;
      clue.showCorrect = false;
      clue.showIncorrect = false;

      clue.deselect = function (solverid, forced) {
        if (!this.selected)
          return;
        solverid %= 8;
        this.selected = false;
        this.forcedSelection = forced;
        this.clearHighlight(solverid);
      };
      clue.select = function (solverid, forced) {
        if (this.selected)
          return;
        solverid %= 8;
        for (const [otherid, other] of Object.entries(cw.clues)) {
          if (otherid != clueid)
            other.deselect(solverid, forced);
        }
        this.selected = true;
        this.forcedSelection = forced;
        this.highlight(solverid);
      };
      clue.highlight = function(solverid, recursive) {
        solverid %= 8;
        this.highlightMask |= (1 << solverid);
        for (let i = 0; i < this.cells.length; i++) {
          const cell = this.cells[i];
          if (this.isAcross) {
            cell.acrossMask |= (1 << solverid);
          } else {
            cell.downMask |= (1 << solverid);
          }
          cell.highlightMask = (cell.acrossMask | cell.downMask);
        }
        if (!recursive) {
          if (this.primary) {
            this.primary.highlight(solverid);
          } else {
            for (let j = 0; j < this.refs.length; j++) {
              this.refs[j].highlight(solverid, true);
            }
          }
        }
      };
      clue.clearHighlight = function(solverid, recursive) {
        solverid %= 8;
        for (let i = 0; i < this.cells.length; i++) {
          const cell = this.cells[i];
          if (this.isAcross) {
            cell.acrossMask &= ~(1 << solverid);
          } else {
            cell.downMask &= ~(1 << solverid);
          }
          cell.highlightMask = (cell.acrossMask | cell.downMask);
        }
        this.highlightMask &= ~(1 << solverid);
        if (!recursive) {
          if (this.primary) {
            this.primary.clearHighlight(solverid);
          } else {
            for (let j = 0; j < this.refs.length; j++) {
                this.refs[j].clearHighlight(solverid, true);
            }
          }
        }
      };
    }

    cw.acrossClues.sort((a, b) => {
        return a.row != b.row ? a.row - b.row : a.col - b.col;
    });
    cw.downClues.sort((a, b) => {
        return a.row != b.row ? a.row - b.row : a.col - b.col;
    });

    [cw.acrossClues, cw.downClues].forEach(clues => {
      clues.forEach((clue, i) => {
          const nextIndex = (i + 1) % clues.length;
          const otherClues = (clue.isAcross ? cw.downClues : cw.acrossClues);
          const nextClues = nextIndex == 0 ? otherClues : clues;
          const prevClues = i == 0 ? otherClues : clues;
          const prevIndex = i > 0 ? i - 1 : otherClues.length - 1;
          clue.nextNumericalClue = nextClues[nextIndex];
          clue.prevNumericalClue = prevClues[prevIndex];
      })
    });
    return cw;
}

module.exports = {
  parseAndBuild: parseAndBuild
}
