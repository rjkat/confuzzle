const enolib = require('enolib');
const enotype = require('enotype');
const sample = require('./sample_crossword');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

function sanitizeHtml(html) {
  return DOMPurify.sanitize(html);
}

const EMOJI_DICT = require('./words_to_emoji.js').EMOJI_DICT;

enolib.register(enotype);

function sampleCrossword() {
  return sample.sampleCrossword();
}

const SANITIZE_HTML_OPTIONS_KEEP_ALLOWED = {
    allowedTags: [ 
        'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'ul', 'ol', 'nl',
        'li', 'b', 'i', 'strong', 'em', 'strike', 'abbr', 'code'
    ]
}

const SANITIZE_HTML_OPTIONS_STRIP_ALL = {
  allowedTags: [],
  allowedAttributes: {}
}

function fromb64(b) {
    return Buffer.from(b, 'base64').toString()
}

function forEachCell(clue, cells, cellFn) {
  let offset = 0;
  if (clue.isAcross) {
    for (let col = clue.col - 1; col < clue.col + clue.totalLength - 1; col++) {
      let cell = cells[`${clue.row - 1},${col}`];
      if (cell) {
        cellFn(cell, offset);
      }
      offset++;
    }
  } else {
    for (let row = clue.row - 1; row < clue.row + clue.totalLength - 1; row++) {
      let cell = cells[`${row},${clue.col - 1}`];
      if (cell) {
        cellFn(cell, offset);
      }
      offset++;
    }
  }
}

function buildCells(cw, cells, clues, compiling) {
  let errors = []
  for (let [clueid, clue] of Object.entries(clues)) {
    const numCol =  clue.isAcross ? clue.col - 1 + clue.numbering.offset : clue.col - 1;
    const numRow = !clue.isAcross ? clue.row - 1 + clue.numbering.offset : clue.row - 1;
    cells[`${numRow},${numCol}`].number = clue.numbering.gridText;
    forEachCell(clue, cells, function (cell, offset) {
      if (cell.empty) {
        cell.clues = {};
        cell.offsets = {};
      } 
      if (clue.isAcross) {
        cell.clues.acrossId = clue.id;
        cell.offsets.across = offset;
      } else {
        cell.clues.downId = clue.id;
        cell.offsets.down = offset;
      }
      if (clue.solution) {
        cell.solution = clue.solution[offset];
        if ((!cw.meta.scramble || cw.meta.scramble == "none") && compiling) {
          cell.contents = cell.solution;
        }
      }
      if (clue.shadingColor) {
        cell.shadingColor = clue.shadingColor;
      }
      cell.empty = false;
      if (offset == 0) {
        clue.cellIds = [];
      }
      clue.cellIds.push(cell.id);
    });

    let word = 0;
    let wordpos = 0;
    for (let i = 0; i < clue.totalLength; i++) {
      if (wordpos == clue.lengths[word] - 1 && word < clue.separators.length) {
        const sep = clue.separators[word];
        if (clue.isAcross) {
          cells[clue.cellIds[i]].acrossSeparator = sep;
          cells[clue.cellIds[i]].sanitizedAcrossSeparator = sanitizeHtml(sep, SANITIZE_HTML_OPTIONS_KEEP_ALLOWED);
        } else {
          cells[clue.cellIds[i]].downSeparator = sep;
          cells[clue.cellIds[i]].sanitizedDownSeparator = sanitizeHtml(sep, SANITIZE_HTML_OPTIONS_KEEP_ALLOWED);
        }
        word++;
        wordpos = 0;
      } else {
        wordpos++;
      }
    }


  }

  for (let [clueid, clue] of Object.entries(clues)) {
    if (clue.primaryId == clue.id && clue.refSeparators) {
      let ref = clue;
      let i = 0;
      let j = 0;

      while (ref && i < clue.refIds.length - 1 && j < clue.refSeparators.length) {
         j += ref.lengths.length - 1; 
         const sep = clue.refSeparators[j];
         const sanitizedSep = sanitizeHtml(sep, SANITIZE_HTML_OPTIONS_KEEP_ALLOWED);
         const cell = cells[ref.cellIds[ref.cellIds.length - 1]];
         if (ref.isAcross) {
           cell.acrossSeparator = sep;
           cell.sanitizedAcrossSeparator = sanitizedSep;
         } else {
           cell.downSeparator = sep;
           cell.sanitizedDownSeparator = sanitizedSep;
         }
         const pid = clue.primaryId;
         if (!cell.refSeparators) {
           cell.refSeparators = {}
           cell.sanitizedRefSeparators = {}
         }
         cell.refSeparators[pid] = sep;
         cell.sanitizedRefSeparators[pid] = sep;
         i++;
         ref = clues[clue.refIds[i]];
      }
    }
  }
  return errors;
}

function buildGrid(cw, compiling) {
  const clues = cw.clues;
  const grid = cw.grid;
  const shading = grid.shading;
  const annotations = grid.annotations;

  grid.cells = {}
  for (let row = 0; row < grid.height; row++) {
    for (let col = 0; col < grid.width; col++) {
      let cellId = `${row},${col}`;
      const cell = {
        id: cellId,
        col: col,
        row: row,
        empty: true,
        contents: '', 
        special: '-',
        acrossMask: 0,
        downMask: 0,
        highlightMask: 0
      };
      grid.cells[cellId] = cell;
    }
  }

  if (shading) {
    shading.forEach(rule => {
      if (rule.rows) {
        for (let i = 0; i < rule.rows.length; i++) {
          grid.cells[`${rule.rows[i] - 1},${rule.cols[i] - 1}`].shadingColor = rule.color;
        }
      }
    });
  }

  if (annotations) {
    annotations.forEach(rule => {
      for (let i = 0; i < rule.rows.length; i++) {
        if (rule.mark)
          grid.cells[`${rule.rows[i] - 1},${rule.cols[i] - 1}`].mark = rule.mark;
        if (rule.rebus)
          grid.cells[`${rule.rows[i] - 1},${rule.cols[i] - 1}`].rebus = rule.rebus;
      }
    });
  }
  return buildCells(cw, grid.cells, clues, compiling);
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

function getLengthText(clue) {
  // don't show lengths on referenced clues or verbatim clues
  if (!clue || clue.verbatim)
      return '';
  if (clue.primaryId && clue.primaryId != clue.id)
      return '';
  let lengthText = ' (';
  let lengths = clue.refLengths ? clue.refLengths : clue.lengths;
  
  // handle case where one clue has been split across multiple grid cells
  if (clue.refLengths
      && clue.refSeparators
      && clue.refSeparators.length == 0) {
      lengths = [clue.refLengths.reduce((acc, x) => acc + x)];
  }
  const sep = clue.refSeparators ? clue.refSeparators : clue.separators;
  for (let i = 0; i < lengths.length; i++) {
      if (i > 0) {
          lengthText += sep[i - 1];
      }
      lengthText += lengths[i];
  }
  if (lengths.length - 1 < sep.length && (!clue.refIds || clue.refIds.length == 0)) {
      lengthText += sep[lengths.length - 1];
  }

  lengthText += ')';
  
  return lengthText;
}

function parseClue(cw, clue) {
  const clueid = clue.stringKey();
  const x = clue.toSection();
  const lengths = x.requiredList('lengths').requiredIntegerValues();
  var solution = x.optionalField('ans');

  if (solution) {
    solution = solution.requiredStringValue();
    if (cw.meta.scramble == 'base64') {
      solution = fromb64(solution);
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
    parsedText = textField.optionalStringValue() || '';
  }
  const parsed = {
    id: clueid,
    isAcross: clueid.slice(-1) == 'A',
    text: parsedText,
    sanitizedText: sanitizeHtml(parsedText, SANITIZE_HTML_OPTIONS_KEEP_ALLOWED),
    plainText: sanitizeHtml(parsedText, SANITIZE_HTML_OPTIONS_STRIP_ALL),
    separators: sep,
    verbatim: x.optionalEmpty('verbatim') ? true : false,
    hidden: x.optionalEmpty('hidden') ? true : false,
    lengths: lengths,
    solution: solution,
    refIds: [],
    totalLength: lengths.reduce((acc, x) => acc + x),
    row: x.requiredField('row').requiredIntegerValue(),
    col: x.requiredField('col').requiredIntegerValue(),
  };

  const number = clueid.match(/\d+/);
  var offset = 0;
  var gridText = !parsed.hidden && number ? number[0] : '';
  var clueText = gridText;

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

  cw.clues[clueid].refLengths = refLengths;
  cw.clues[clueid].refSeparators = refSeparators;
  cw.clues[clueid].refIds = refIds;
  for (var i = 0; i < refIds.length; i++) {
    cw.clues[refIds[i]].primaryId = clueid;
    cw.clues[refIds[i]].refIds = refIds;
  }
}

function parseFilled(cw, filled) {
  const clueid = filled.stringKey();
  if (!cw.clues[clueid]) {
    throw "Unknown clue in state section: " + clueid;
  }
  const x = filled.toSection();
  const clue = cw.clues[clueid];
  const mark = x.optionalField('mark');
  if (mark) {
    const m = mark.requiredStringValue();
    clue.mark = m;    
  }
  const ans = x.requiredField('ans').requiredStringValue();
  const cells = cw.grid.cells;
  for (var i = 0; i < clue.cellIds.length; i++) {
    if (ans[i] != '-') {
      cells[clue.cellIds[i]].contents = ans[i];
    }
  }

  const special = x.optionalField('special');
  if (special) {
    const s = special.requiredStringValue();
    const clue = cw.clues[clueid];
    for (var i = 0; i < clue.cellIds.length; i++) {
      cells[clue.cellIds[i]].special = s[i];
    }
  }
}

function parse(input, compiling, options) {
  const cw = {
    meta: {
      emoji: [],
      copyright: ''
    },
    grid: {},
    clues: {}
  };
  const doc = enolib.parse(input, options);
  const meta = doc.requiredSection('meta');
  ['name', 'author'].forEach(field =>
    cw.meta[field] = meta.requiredField(field).requiredStringValue()
  );
  // sanitize author
  cw.meta.author = cw.meta.author.replace(/^\s*by\s+/i, '');
  ['type', 'identifier', 'copyright', 'note', 'scramble', 'url', 'gid'].forEach(field => {
    const f = meta.optionalField(field);
    if (f) {
       cw.meta[field] = f.requiredStringValue();
    }
    if (field == 'type' && !cw.meta[field]) {
       cw.meta.type = 'cryptic';
    }
  });
  cw.meta.fullName = cw.meta.name + ' by ' + cw.meta.author;

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
              const ruleName = el.stringKey();
              const color = x.requiredField('color').requiredColorValue();
              let colorClues = x.optionalList('clues');
              if (colorClues) {
                colorClues = colorClues.requiredStringValues();
                cw.grid.shading.push({
                  name: ruleName,
                  color: color,
                  clues: colorClues
                });
              } else {
                let colorRows = x.optionalList('rows');
                let colorCols = [];
                if (colorRows) {
                  colorRows = colorRows.requiredIntegerValues();
                  colorCols = x.requiredList('cols').requiredIntegerValues();
                } else {
                  const row = x.requiredField('row').requiredIntegerValue();
                  colorRows = [row];
                  const col = x.requiredField('col').requiredIntegerValue();
                  colorCols = [col];
                }
                cw.grid.shading.push({
                  name: ruleName,
                  color: color,
                  rows: colorRows,
                  cols: colorCols
                });
              }
          });
        }
      }
      if (name == "annotations") {
        cw.grid.annotations = [];
        const annEls = section.elements(); {
          annEls.forEach(el => {
              const x = el.toSection();
              const ruleName = el.stringKey();
              const annRows = x.requiredList('rows').requiredIntegerValues();
              const annCols = x.requiredList('cols').requiredIntegerValues();
              const rule = {
                name: ruleName,
                rows: annRows,
                cols: annCols
              }
              const mark = x.optionalField('mark');
              if (mark) {
                rule.mark = mark.requiredStringValue();
              }
              const rebus = x.optionalField('rebus');
              if (rebus) {
                rule.rebus = rebus.requiredStringValue();
              }
              cw.grid.annotations.push(rule);
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

  const filledClues = doc.optionalSection('state');
  if (filledClues) {
    filledClues.elements().forEach(clue => parseFilled(cw, clue));
  }

  for (const [clueid, clue] of Object.entries(cw.clues)) {
    // identify crossword using text of first clue
    if (!cw.meta.id)
      cw.meta.id = clue.text;
    clue.lengthText = getLengthText(clue);
    clue.sanitizedLengthText = sanitizeHtml(clue.lengthText);
  }

  return cw;
};

module.exports = {
  sampleCrossword: sampleCrossword,
  parse: parse
}
