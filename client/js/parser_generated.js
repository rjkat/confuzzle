const enolib = require('enolib');
const enotype = require('enotype');
const fs = require('fs');

enolib.register(enotype);

exports.parse = path => {
  const input = fs.readFileSync(path, 'utf-8');
  const _document = enolib.parse(input, { source: path });

  const document = {};
  {
    document.metadata = {};
    const _metadata = _document.requiredSection('metadata');
    const metadata = document.metadata;
    metadata.name = _metadata.requiredField('name').requiredStringValue();
    metadata.author = _metadata.requiredField('author').requiredStringValue();
    metadata.pubdate = _metadata.requiredField('pubdate').requiredStringValue();
    metadata.copyright = _metadata.requiredField('copyright').requiredStringValue();
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
    clues.across = _clues.requiredList('across').requiredStringValues();
    clues.down = _clues.requiredList('down').requiredStringValues();
  }

  return document;
};