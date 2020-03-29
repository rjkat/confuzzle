const enolib = require('enolib');
const enotype = require('enotype');

enolib.register(enotype);

function parseClue(clue) {
  console.log("clue: " + clue.stringKey());
  const x = clue.toSection();
  const sep = x.optionalList('separators');
  const parsed = {
    text: x.requiredField('text').requiredStringValue(),
    lengths: x.requiredList('lengths').requiredIntegerValues(),
    coords: x.requiredList('coords').requiredIntegerValues(),
    separators: (sep ? sep.requiredStringValues() : [])
  };
  console.log(JSON.stringify(parsed));
  return parsed;
}

export function parse(input, options) {
  const _document = enolib.parse(input, options);

  const document = {};
  {
    document.meta = {};
    const _meta = _document.requiredSection('meta');
    const meta = document.meta;
    meta.name = _meta.requiredField('name').requiredStringValue();
    meta.author = _meta.requiredField('author').requiredStringValue();
    meta.pubdate = _meta.requiredField('pubdate').requiredStringValue();
    meta.copyright = _meta.requiredField('copyright').requiredStringValue();
  }
  {
    document.grid = {};
    const _grid = _document.requiredSection('grid');
    const grid = document.grid;
    grid.width = _grid.requiredField('width').requiredIntegerValue();
    grid.height = _grid.requiredField('height').requiredIntegerValue();
  }
  {
    document.clues = {};
    const _clues = _document.requiredSection('clues');
    const clues = document.clues;
    const _across = _clues.requiredSection('across').elements();
    _across.forEach(parseClue);
  }

  return document;
};