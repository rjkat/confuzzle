const enolib = require('enolib');
const enotype = require('enotype');
const sample = require('./sample_crossword');

import {EMOJI_DICT} from './words_to_emoji.js';

enolib.register(enotype);

export function sampleCrossword() {
  return sample.sampleCrossword();
}

function forEachCell(clue, cells, cellFn) {
  let offset = 0;
  if (clue.isAcross) {
    for (let col = clue.col - 1; col < clue.col + clue.totalLength - 1; col++) {
      let r = cells[clue.row - 1];
      if (r && r[col]) {
        cellFn(r[col], offset);
      }
      offset++;
    }
  } else {
    for (let row = clue.row - 1; row < clue.row + clue.totalLength - 1; row++) {
      let r = cells[row];
      let col = clue.col - 1;
      if (r && r[col]) {
        cellFn(r[col], offset);
      }
      offset++;
    }
  }
}

function populateCells(cw, cells, clues, compiling) {
  let errors = []
  for (let [clueid, clue] of Object.entries(clues)) {
    const numCol =  clue.isAcross ? clue.col - 1 + clue.numbering.offset : clue.col - 1;
    const numRow = !clue.isAcross ? clue.row - 1 + clue.numbering.offset : clue.row - 1;
    cells[numRow][numCol].number = clue.numbering.gridText;
    forEachCell(clue, cells, function (cell, offset) {
      if (cell.empty) {
        cell.clues = {};
        cell.offsets = {};
      } else {
        const other = cell.clues.across || cell.clues.down;
        const otheroffset = (cell.offsets.across !== undefined ?
                             cell.offsets.across : cell.offsets.down);
        if (!clue.intersections) {
            clue.intersections = {};
        }
        if (!other.intersections) {
            other.intersections = {};
        }
        clue.intersections[offset] = {clueid: other.id, offset: otheroffset};
        other.intersections[otheroffset] = {clueid: clue.id, offset: offset};
      }
      if (clue.isAcross) {
        cell.clues.across = clue;
        cell.offsets.across = offset;
      } else {
        cell.clues.down = clue;
        cell.offsets.down = offset;
      }
      if (clue.solution) {
        cell.solution = clue.solution[offset];
        if ((!cw.meta.scramble || cw.meta.scramble == "none") && compiling) {
          cell.contents = cell.solution;
        }
      }
      cell.empty = false;
      if (offset == 0) {
        clue.cells = [];
      }
      clue.cells.push(cell);
    });

    let word = 0;
    let wordpos = 0;
    for (let i = 0; i < clue.totalLength; i++) {
      if (wordpos == clue.lengths[word] - 1 && word < clue.separators.length) {
        const sep = clue.separators[word];
        if (clue.isAcross) {
          clue.cells[i].acrossSeparator = sep;
        } else {
          clue.cells[i].downSeparator = sep;
        }
        word++;
        wordpos = 0;
      } else {
        wordpos++;
      }
    }
  }
  return errors;
}

function buildGrid(cw, compiling) {
  const clues = cw.clues;
  const grid = cw.grid;
  const shading = grid.shading;
  grid.cells = []
  for (let row = 1; row <= grid.height; row++) {
    let rowCells = [];
    for (let col = 1; col <= grid.width; col++) {
      const cell = {
        col: col - 1,
        row: row - 1,
        empty: true,
        contents: ''
      };
      if (shading) {
        shading.forEach(rule => {
          if (rule.row && row == rule.row && col == rule.col) {
              cell.shadingColor = rule.color;
          }
        });
      }
      rowCells.push(cell);
    }
    grid.cells.push(rowCells);
  }
  return populateCells(cw, grid.cells, clues, compiling);
}

function addEmoji(cw, word) {
  if (word.length <= 2) {
    return;
  }
  const wordEmoji = EMOJI_DICT[word.toLowerCase()];
  if (wordEmoji) {
    // if there is only one emoji for this word, include lots of it
    if (wordEmoji.length == 1) {
      for (var i = 0; i < 3; i++) {
        cw.meta.emoji.push(wordEmoji[0]); 
      }
    } else {
      for (var i = 0; i < wordEmoji.length; i++) {
        cw.meta.emoji.push(wordEmoji[i]); 
      }
    }
  }
}

function addAllEmoji(cw, word) {
  addEmoji(cw, word);
  // add plurals as well
  if (word[word.length - 1] == 'S') {
    addEmoji(cw, word.slice(0, word.length - 1));
  }
}

function parseClue(cw, clue) {
  const clueid = clue.stringKey();
  const x = clue.toSection();
  const lengths = x.requiredList('lengths').requiredIntegerValues();
  var solution = x.optionalField('ans');

  if (solution) {
    solution = solution.requiredStringValue();
    if (cw.meta.scramble == 'base64') {
      solution = atob(solution);
    }
    var emoji = [];
    var wordStart = 0;
    for (var i = 0; i <= lengths.length - 1; i++) {
      const word = solution.slice(wordStart, wordStart + lengths[i]);
      addAllEmoji(cw, word);
      wordStart = lengths[i];
    }
  }
  const nwords = lengths.length;
  var sep = x.optionalList('separators');
  if (sep) {
    sep = sep.requiredStringValues();
  } else {
    sep = nwords > 0 ? Array(nwords - 1).fill(",") : [];
  }
  const textField = x.optionalField('text');
  var parsedText = '';
  if (textField) {
    parsedText = textField.requiredStringValue();
  }
  const parsed = {
    id: clueid,
    isAcross: clueid.slice(-1) == 'A',
    text: parsedText,
    separators: sep,
    verbatim: x.optionalEmpty('verbatim') ? true : false,
    lengths: lengths,
    solution: solution,
    refIds: [],
    totalLength: lengths.reduce((acc, x) => acc + x),
    row: x.requiredField('row').requiredIntegerValue(),
    col: x.requiredField('col').requiredIntegerValue()
  };

  const number = clueid.match(/\d+/);
  var offset = 0;
  var gridText = number ? parseInt(number, 10) : '';
  var clueText = gridText + (parsed.isAcross ? 'A' : 'D');

  const numbering = x.optionalSection('numbering');

  if (numbering) {
    offset = numbering.optionalField('offset');
    if (offset) {
      offset = offset.requiredIntegerValue();
    }
    const gridField = numbering.optionalField('grid');
    if (gridField) {
      gridText = gridField.optionalStringValue() || "";
    }
    const clueField = numbering.optionalField('clue');
    if (clueField) {
      clueText = clueField.optionalStringValue() || "";
    }
  }

  parsed.numbering = {
    offset: offset,
    gridText: gridText,
    clueText: clueText
  };


  if (cw.grid.shading) {
    cw.grid.shading.forEach(rule => {
      if (rule.clues && rule.clues.includes(clueid)) {
        parsed.shadingColor = rule.color;
      }
    });
  }

  cw.clues[clueid] = parsed;
}

function parseRef(cw, ref) {
  const clueid = ref.stringKey();
  if (!cw.clues[clueid]) {
    throw "Unknown clue in references section: " + clueid;
  }
  const x = ref.toSection();
  const refIds = x.requiredList('clues').requiredStringValues();
  var sep = x.optionalList('separators');
  if (sep) {
    sep = sep.requiredStringValues();
  } else {
    sep = Array(refIds.length - 1).fill(",");
  }
  var refLengths = [];
  var refSeparators = [];
  for (var i = 0; i < refIds.length; i++) {
    const refClue = cw.clues[refIds[i]];
    if (!refClue) {
      throw "Unknown clue in references section: " + refIds[i];
    }
    refSeparators = refSeparators.concat(refClue.separators);
    refLengths = refLengths.concat(refClue.lengths);
    if (i < sep.length) {
      refSeparators.push(sep[i]);
    }
  }
  if (i < sep.length) {
    refSeparators.push(sep[i]);
  }


  for (var i = 0; i < refIds.length; i++) {
    cw.clues[refIds[i]].refLengths = refLengths;
    cw.clues[refIds[i]].refSeparators = refSeparators;
    cw.clues[refIds[i]].refIds = refIds;
  }
}

export function parse(input, compiling, options) {
  const cw = {
    meta: {
      emoji: [],
    },
    grid: {},
    clues: {}
  };
  const doc = enolib.parse(input, options);
  const meta = doc.requiredSection('meta');
  ['name', 'author'].forEach(field =>
    cw.meta[field] = meta.requiredField(field).requiredStringValue()
  );
  if (cw.meta.name.startsWith('smh-cryptic')) {
    cw.meta.name = 'cryptic';
  }
  // sanitize author
  cw.meta.author = cw.meta.author.replace(/^(.*\s+)?by\s+/i, '');
  ['type', 'identifier', 'copyright', 'note', 'scramble'].forEach(field => {
    const f = meta.optionalField(field);
    if (f) {
       cw.meta[field] = f.requiredStringValue()
    }
    if (field == 'type' && !cw.meta[field]) {
       cw.meta.type = 'cryptic';
    }
  });

  const grid = doc.requiredSection('grid');
  ['width', 'height'].forEach(field =>
    cw.grid[field] = grid.requiredField(field).requiredIntegerValue()
  );

  const gridEls = grid.elements();
  gridEls.forEach(el => {
    if (el.yieldsSection()) {
      const name = el.stringKey();
      const section = el.toSection();
      if (name == "shading") {
        cw.grid.shading = [];
        const shadingEls = section.elements(); {
          shadingEls.forEach(el => {
              const x = el.toSection();
              const color = x.requiredField('color').requiredColorValue();
              let colorClues = x.optionalList('clues');
              if (colorClues) {
                colorClues = colorClues.requiredStringValues();
                cw.grid.shading.push({
                  color: color,
                  clues: colorClues
                });
              } else {
                const row = x.requiredField('row').requiredIntegerValue();
                const col = x.requiredField('col').requiredIntegerValue();
                cw.grid.shading.push({
                  color: color,
                  row: row,
                  col: col,
                });
              }
          });
        }
      }
    }
  });

  const clues = doc.requiredSection('clues').elements();
  clues.forEach(clue => parseClue(cw, clue));

  const refs = doc.optionalSection('references');
  if (refs) {
    refs.elements().forEach(ref => parseRef(cw, ref));
  }
  let errors = buildGrid(cw, compiling);

  return cw;
};


