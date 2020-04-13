const enolib = require('enolib');
const enotype = require('enotype');
const sample = require('./sample_crossword');

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

function populateCells(cells, clues) {
  let errors = []
  for (let [clueid, clue] of Object.entries(clues)) {
    cells[clue.row - 1][clue.col - 1].number = clue.number;
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

function buildGrid(cw) {
  const clues = cw.clues;
  const grid = cw.grid;
  const shading = grid.shading;
  grid.cells = []
  for (let row = 1; row <= grid.height; row++) {
    let rowCells = [];
    for (let col = 1; col <= grid.width; col++) {
      const cell = {
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
  return populateCells(grid.cells, clues);
}

function parseClue(cw, clue) {
  const clueid = clue.stringKey();
  const x = clue.toSection();
  const lengths = x.requiredList('lengths').requiredIntegerValues();
  const nwords = lengths.length;
  var sep = x.optionalList('separators');
  if (sep) {
    sep = sep.requiredStringValues();
  } else {
    sep = nwords > 0 ? Array(nwords - 1).fill(",") : [];
  }
  
  const parsed = {
    id: clueid,
    isAcross: clueid.slice(-1) == 'A',
    number: parseInt(clueid.slice(0, -1), 10),
    text: x.requiredField('text').requiredStringValue(),
    separators: sep,
    lengths: lengths,
    totalLength: lengths.reduce((acc, x) => acc + x),
    row: x.requiredField('row').requiredIntegerValue(),
    col: x.requiredField('col').requiredIntegerValue()
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

export function parse(input, options) {
  const cw = {
    meta: {},
    grid: {},
    clues: {}
  };
  const doc = enolib.parse(input, options);
  const meta = doc.requiredSection('meta');
  ['name', 'author'].forEach(field =>
    cw.meta[field] = meta.requiredField(field).requiredStringValue()
  );
  ['type', 'identifier', 'copyright', 'note'].forEach(field => {
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

  
  let errors = buildGrid(cw);

  return cw;
};


