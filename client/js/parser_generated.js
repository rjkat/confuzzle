const enolib = require('enolib');
const enotype = require('enotype');
const fs = require('fs');

enolib.register(enotype);

exports.parse = path => {
  const input = fs.readFileSync(path, 'utf-8');
  const _document = enolib.parse(input, { source: path });

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
    {
      clues.across = {};
      const _across = _clues.requiredSection('across');
      const across = clues.across;
      {
        across.1 = {};
        const _1 = _across.requiredSection('1');
        const 1 = across.1;
        1.text = _1.requiredField('text').requiredStringValue();
        1.lengths = _1.requiredList('lengths').requiredIntegerValues();
        {
          const _coords = _1.requiredFieldset('coords');
          1.coords = {};
          1.coords.col = _coords.requiredEntry('col').requiredIntegerValue();
          1.coords.row = _coords.requiredEntry('row').requiredIntegerValue();
        }
      }
      {
        across.5 = {};
        const _5 = _across.requiredSection('5');
        const 5 = across.5;
        5.text = _5.requiredField('text').requiredStringValue();
        5.lengths = _5.requiredList('lengths').requiredIntegerValues();
        {
          const _coords = _5.requiredFieldset('coords');
          5.coords = {};
          5.coords.col = _coords.requiredEntry('col').requiredIntegerValue();
          5.coords.row = _coords.requiredEntry('row').requiredIntegerValue();
        }
      }
      {
        across.10 = {};
        const _10 = _across.requiredSection('10');
        const 10 = across.10;
        10.text = _10.requiredField('text').requiredStringValue();
        10.lengths = _10.requiredList('lengths').requiredIntegerValues();
        {
          const _coords = _10.requiredFieldset('coords');
          10.coords = {};
          10.coords.col = _coords.requiredEntry('col').requiredIntegerValue();
          10.coords.row = _coords.requiredEntry('row').requiredIntegerValue();
        }
      }
      {
        across.11 = {};
        const _11 = _across.requiredSection('11');
        const 11 = across.11;
        11.text = _11.requiredField('text').requiredStringValue();
        11.lengths = _11.requiredList('lengths').requiredIntegerValues();
        {
          const _coords = _11.requiredFieldset('coords');
          11.coords = {};
          11.coords.col = _coords.requiredEntry('col').requiredIntegerValue();
          11.coords.row = _coords.requiredEntry('row').requiredIntegerValue();
        }
      }
      {
        across.12 = {};
        const _12 = _across.requiredSection('12');
        const 12 = across.12;
        12.text = _12.requiredField('text').requiredStringValue();
        12.lengths = _12.requiredList('lengths').requiredIntegerValues();
        {
          const _coords = _12.requiredFieldset('coords');
          12.coords = {};
          12.coords.col = _coords.requiredEntry('col').requiredIntegerValue();
          12.coords.row = _coords.requiredEntry('row').requiredIntegerValue();
        }
      }
      {
        across.13 = {};
        const _13 = _across.requiredSection('13');
        const 13 = across.13;
        13.text = _13.requiredField('text').requiredStringValue();
        13.lengths = _13.requiredList('lengths').requiredIntegerValues();
        13.separators = _13.requiredList('separators').requiredStringValues();
        {
          const _coords = _13.requiredFieldset('coords');
          13.coords = {};
          13.coords.col = _coords.requiredEntry('col').requiredIntegerValue();
          13.coords.row = _coords.requiredEntry('row').requiredIntegerValue();
        }
      }
      {
        across.15 = {};
        const _15 = _across.requiredSection('15');
        const 15 = across.15;
        15.text = _15.requiredField('text').requiredStringValue();
        15.lengths = _15.requiredList('lengths').requiredIntegerValues();
        {
          const _coords = _15.requiredFieldset('coords');
          15.coords = {};
          15.coords.col = _coords.requiredEntry('col').requiredIntegerValue();
          15.coords.row = _coords.requiredEntry('row').requiredIntegerValue();
        }
      }
      {
        across.17 = {};
        const _17 = _across.requiredSection('17');
        const 17 = across.17;
        17.text = _17.requiredField('text').requiredStringValue();
        17.lengths = _17.requiredList('lengths').requiredIntegerValues();
        {
          const _coords = _17.requiredFieldset('coords');
          17.coords = {};
          17.coords.col = _coords.requiredEntry('col').requiredIntegerValue();
          17.coords.row = _coords.requiredEntry('row').requiredIntegerValue();
        }
      }
      {
        across.19 = {};
        const _19 = _across.requiredSection('19');
        const 19 = across.19;
        19.text = _19.requiredField('text').requiredStringValue();
        19.lengths = _19.requiredList('lengths').requiredIntegerValues();
        {
          const _coords = _19.requiredFieldset('coords');
          19.coords = {};
          19.coords.col = _coords.requiredEntry('col').requiredIntegerValue();
          19.coords.row = _coords.requiredEntry('row').requiredIntegerValue();
        }
      }
      {
        across.20 = {};
        const _20 = _across.requiredSection('20');
        const 20 = across.20;
        20.text = _20.requiredField('text').requiredStringValue();
        20.lengths = _20.requiredList('lengths').requiredIntegerValues();
        {
          const _coords = _20.requiredFieldset('coords');
          20.coords = {};
          20.coords.col = _coords.requiredEntry('col').requiredIntegerValue();
          20.coords.row = _coords.requiredEntry('row').requiredIntegerValue();
        }
      }
      {
        across.21 = {};
        const _21 = _across.requiredSection('21');
        const 21 = across.21;
        21.text = _21.requiredField('text').requiredStringValue();
        21.lengths = _21.requiredList('lengths').requiredIntegerValues();
        {
          const _coords = _21.requiredFieldset('coords');
          21.coords = {};
          21.coords.col = _coords.requiredEntry('col').requiredIntegerValue();
          21.coords.row = _coords.requiredEntry('row').requiredIntegerValue();
        }
      }
      {
        across.25 = {};
        const _25 = _across.requiredSection('25');
        const 25 = across.25;
        25.text = _25.requiredField('text').requiredStringValue();
        25.lengths = _25.requiredList('lengths').requiredIntegerValues();
        {
          const _coords = _25.requiredFieldset('coords');
          25.coords = {};
          25.coords.col = _coords.requiredEntry('col').requiredIntegerValue();
          25.coords.row = _coords.requiredEntry('row').requiredIntegerValue();
        }
      }
      {
        across.26 = {};
        const _26 = _across.requiredSection('26');
        const 26 = across.26;
        26.text = _26.requiredField('text').requiredStringValue();
        26.lengths = _26.requiredList('lengths').requiredIntegerValues();
        {
          const _coords = _26.requiredFieldset('coords');
          26.coords = {};
          26.coords.col = _coords.requiredEntry('col').requiredIntegerValue();
          26.coords.row = _coords.requiredEntry('row').requiredIntegerValue();
        }
      }
      {
        across.27 = {};
        const _27 = _across.requiredSection('27');
        const 27 = across.27;
        27.text = _27.requiredField('text').requiredStringValue();
        27.lengths = _27.requiredList('lengths').requiredIntegerValues();
        {
          const _coords = _27.requiredFieldset('coords');
          27.coords = {};
          27.coords.col = _coords.requiredEntry('col').requiredIntegerValue();
          27.coords.row = _coords.requiredEntry('row').requiredIntegerValue();
        }
      }
      {
        across.28 = {};
        const _28 = _across.requiredSection('28');
        const 28 = across.28;
        28.text = _28.requiredField('text').requiredStringValue();
        28.lengths = _28.requiredList('lengths').requiredIntegerValues();
        {
          const _coords = _28.requiredFieldset('coords');
          28.coords = {};
          28.coords.col = _coords.requiredEntry('col').requiredIntegerValue();
          28.coords.row = _coords.requiredEntry('row').requiredIntegerValue();
        }
      }
    }
  }

  return document;
};