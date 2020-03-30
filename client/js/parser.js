const enolib = require('enolib');
const enotype = require('enotype');

enolib.register(enotype);

export function forEachCell(clue, cells, cellFn) {
  if (clue.isAcross) {
    for (let col = clue.col - 1; col < clue.col + clue.totalLength - 1; col++) {
      let r = cells[clue.row - 1];
      if (r && r[col]) {
        cellFn(r[col]);
      }
    }
  } else {
    for (let row = clue.row - 1; row < clue.row + clue.totalLength - 1; row++) {
      let r = cells[row];
      let col = clue.col - 1;
      if (r && r[col]) {
        cellFn(r[col]);
      }
    }
  }
}

function populateCells(cells, clues) {
  let errors = []
  for (let [clueid, clue] of Object.entries(clues)) {
    cells[clue.row - 1][clue.col - 1].number = clue.number;
    forEachCell(clue, cells, function (cell) {
      if (cell.empty) {
        cell.clues = {};
      }
      if (clue.isAcross) {
        cell.clues.across = clue;
      } else {
        cell.clues.down = clue;
      }
      cell.empty = false;
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

export function sampleCrossword() {
  return `# meta
name: SMH Cryptic, October 10, 2003
author: DA
pubdate: 2003/10/10
copyright: The Sydney Morning Herald

# grid
width: 15
height: 15

# clues

## 1A
row: 1
col: 1
text: Big in East London, say, since radical birth control
lengths:
    - 8

## 5A
row: 1
col: 10
text: It's hard hiding gun during curtailed diplomacy
lengths:
    - 6

## 10A
row: 3
col: 1
text: Dictate ribs and crepe combo
lengths:
    - 9

## 11A
row: 3
col: 11
text: Audience fool explorer
lengths:
    - 5

## 12A
text: Honest molesters punished at last, emphatically
row: 5
col: 1
lengths:
    - 5
    - 10

## 13A
row: 7
col: 1
text: Reportedly escape blame from snappy Venus
lengths:
    - 3
    - 4
separators:
    - -
    
## 15A
row: 7
col: 9
text: Waddled off?!
lengths:
    - 7
    
## 17A
row: 9
col: 1
text: Dressed famous bass singer, Paul?
lengths:
    - 7

## 19A
row: 9
col: 9
text: Some mimic a Nastase game
lengths:
    - 7

    
## 21A
text: Rage therapy bloke discovered language adds years to blokes, given time
row: 11
col: 1
lengths:
    - 5
    - 10
    
## 25A
row: 13
col: 1
text: Analgesia helping to lessen my ultimate pain
lengths:
    - 5
    
## 26A
text: Fruit linked to cancer?
row: 13
col: 7
lengths:
    - 4
    - 5
    
## 27A
row: 15
col: 1
text: Slur Berlin parent
lengths:
    - 6

## 28A
row: 15
col: 8
text: Political sister suffering Me-Factor
lengths:
    - 8
    
## 1D
row: 1
col: 1
text: Shows most of hypothermia 
lengths:
    - 5

## 2D
row: 1
col: 3
text: Explorer guy gutless to accept radio confirmation going north 
lengths:
    - 7

## 3D
row: 1
col: 5
text: Australian novelist a cut above peers? 
lengths:
    - 4
    - 5

## 4D
row: 1
col: 7
text: Shelled Croatia lacking a model capital 
lengths:
    - 5

## 6D
row: 1
col: 11
text: Road bank fails to start motorist warning 
lengths:
    - 5

## 7D
row: 1
col: 13
text: Healthier-sounding Gippsland town? 
lengths:
    - 7

## 8D
row: 1
col: 15
text: Dry places damage water-clock 
lengths:
    - 9

## 9D
row: 2
col: 9
text: Orderly hit theid.com 
lengths:
    - 8

## 13D
text: Hell's bells? 
row: 7
col: 1
lengths:
    - 4
    - 5

## 14D
row: 7
col: 7
text: Encloses soldiers, say, at pirate hideout 
lengths:
    - 8

## 16D
row: 7
col: 11
text: Entangled pub, perhaps, before motorhome 
lengths:
    - 9

## 18D
row: 9
col: 3
text: Chauvinist accepts turn of sasquatch 
lengths:
    - 7
    
## 20D
row: 9
col: 13
text: Dozer rail beam
lengths:
    - 7

## 22D
row: 11
col: 5
text: Frost mentioned poem 
lengths:
    - 5

## 23D
row: 11
col: 9
text: Saw a fashion victim starting early 
lengths:
    - 5

## 24D
row: 11
col: 15
text: Pinching the softer centre 
lengths:
    - 5
`;
}