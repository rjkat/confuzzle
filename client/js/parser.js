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
    coords: x.requiredList('coords').requiredIntegerValues(),
    separators: sep
  };
  console.log(k + ': ' + JSON.stringify(doc.clues[k]));
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