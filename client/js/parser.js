const enolib = require('enolib');
const enotype = require('enotype');

enolib.register(enotype);

function parseClue(doc, clue) {
  const k = clue.stringKey();
  const x = clue.toSection();
  const lengths = x.requiredList('lengths').requiredIntegerValues();
  const nwords = lengths.length;
  var sep = x.optionalList('separators');
  if (sep) {
    sep = sep.requiredStringValues();
  } else {
    sep = nwords > 0 ? Array(nwords - 1).fill(",") : [];
  }
  doc.clues[k] = {
    text: x.requiredField('text').requiredStringValue(),
    lengths: lengths,
    row: x.requiredField('row').requiredIntegerValue(),
    col: x.requiredField('col').requiredIntegerValue(),
    separators: sep
  };
}

export function parse(input, options) {
  const _doc = enolib.parse(input, options);

  const doc = {};
  {
    doc.meta = {};
    const _meta = _doc.requiredSection('meta');
    const meta = doc.meta;
    meta.name = _meta.requiredField('name').requiredStringValue();
    meta.author = _meta.requiredField('author').requiredStringValue();
    meta.pubdate = _meta.requiredField('pubdate').requiredStringValue();
    meta.copyright = _meta.requiredField('copyright').requiredStringValue();
  }
  {
    doc.grid = {};
    const _grid = _doc.requiredSection('grid');
    const grid = doc.grid;
    grid.width = _grid.requiredField('width').requiredIntegerValue();
    grid.height = _grid.requiredField('height').requiredIntegerValue();
  }
  {
    doc.clues = {};
    const _clues = _doc.requiredSection('clues').elements();
    _clues.forEach(clue => parseClue(doc, clue));
  }

  return doc;
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
    
## 20A
row: 9
col: 13
text: Dozer rail beam
lengths:
    - 7
    
## 21A
text: Rage therapy bloke discovered language adds years to blokes, given time
row: 1
col: 11
lengths:
    - 5
    - 10
    
## 25A
row: 1
col: 13
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