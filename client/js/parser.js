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
  }
  return errors;
}

function buildGrid(cw) {
  let clues = cw.clues;
  let grid = cw.grid;
  grid.cells = []
  for (let row = 1; row <= grid.height; row++) {
    let rowCells = [];
    for (let col = 1; col <= grid.width; col++) {
      rowCells.push({
        empty: true,
        contents: ''
      });
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
  cw.clues[clueid] = {
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
}

export function parse(input, options) {
  const cw = {
    meta: {},
    grid: {},
    clues: {}
  };
  const doc = enolib.parse(input, options);
  const meta = doc.requiredSection('meta');
  ['name', 'author', 'pubdate', 'copyright'].forEach(field =>
    cw.meta[field] = meta.requiredField(field).requiredStringValue()
  );
  
  const grid = doc.requiredSection('grid');
  ['width', 'height'].forEach(field =>
    cw.grid[field] = grid.requiredField(field).requiredIntegerValue()
  );

  const clues = doc.requiredSection('clues').elements();
  clues.forEach(clue => parseClue(cw, clue));
  
  let errors = buildGrid(cw);

  return cw;
};


