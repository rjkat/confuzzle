
const iconv = require('iconv-lite');

import {ALL_EMOJIS, Mapping, convertBase} from './emojis.js';
const base64url = require("base64url");
import {MTFModel} from './compressjs/MTFModel.js'

import {forward_bwt, inverse_bwt} from './bwt.js'

// Strings in puz files are ISO-8859-1.

// From https://www.i18nqa.com/debug/table-iso8859-1-vs-windows-1252.html:
// ISO-8859-1 (also called Latin-1) is identical to Windows-1252 (also called CP1252)
// except for the code points 128-159 (0x80-0x9F). ISO-8859-1 assigns several control
// codes in this range. Windows-1252 has several characters, punctuation, arithmetic
// and business symbols assigned to these code points.
const PUZ_ENCODING = "windows-1252";

const PUZ_BLACK_SQUARE_CHAR = '.';

const PUZ_HEADER_CONSTANTS = {
    offsets: {
        FILE_CHECKSUM: 0x00,
        MAGIC: 0x02,
        HEADER_CHECKSUM: 0x0E,
        ICHEATED_CHECKSUM: 0x10,
        VERSION: 0x18,
        RES1: 0x1C,
        SCRAMBLED_CHECKSUM: 0x1E,
        RES2: 0x20,
        WIDTH: 0x2C,
        HEIGHT: 0x2D,
        NUM_CLUES: 0x2E,
        UNKNOWN_BITMASK: 0x30,
        SCRAMBLED_TAG: 0x32,
    },
    lengths: {
        MAGIC: 0x0B,
        VERSION: 0x04,
        ICHEATED_CHECKSUM: 0x08,
        RES2: 0x0C,
        HEADER: 0x34
    },
};

const STRIPPED_ENCODING = "utf-8";

const STRIPPED_HEADER_CONSTANTS = {
    offsets: {
        WIDTH: 0x00,
        HEIGHT: 0x01,
        NUM_CLUES: 0x02,
    },
    lengths: {
        HEADER: 0x04
    }
};


// names of string fields
const PUZ_STRING_FIELDS = ['title', 'author', 'copyright'];

// http://code.google.com/p/puz/wiki/FileFormat
// https://github.com/tedtate/puzzler/blob/master/lib/crossword.js
function readHeader(buf, stripped) {
    if (stripped) {
        const x = STRIPPED_HEADER_CONSTANTS.offsets;
        return {
            WIDTH: buf.readUInt8(x.WIDTH),
            HEIGHT: buf.readUInt8(x.HEIGHT),
            NUM_CLUES: buf.readUInt16LE(x.NUM_CLUES)
        }
    }
    const i = PUZ_HEADER_CONSTANTS.offsets;
    const n = PUZ_HEADER_CONSTANTS.lengths;
    return {
        FILE_CHECKSUM: buf.readUInt16LE(i.FILE_CHECKSUM),
        MAGIC: buf.toString('utf8', i.MAGIC, i.MAGIC + n.MAGIC),
        HEADER_CHECKSUM: buf.readUInt16LE(i.HEADER_CHECKSUM),
        ICHEATED_CHECKSUM: buf.toString('hex', i.ICHEATED_CHECKSUM, i.ICHEATED_CHECKSUM + n.ICHEATED_CHECKSUM),
        VERSION: buf.toString('utf8', i.VERSION, i.VERSION + n.VERSION),
        RES1: buf.readUInt16LE(i.RES1),
        SCRAMBLED_CHECKSUM: buf.readUInt16LE(i.SCRAMBLED_CHECKSUM),
        RES2: buf.toString('hex', i.RES2, i.RES2 + n.RES2),
        WIDTH: buf.readUInt8(i.WIDTH),
        HEIGHT: buf.readUInt8(i.HEIGHT),
        NUM_CLUES: buf.readUInt16LE(i.NUM_CLUES),
        UNKNOWN_BITMASK: buf.readUInt16LE(i.UNKNOWN_BITMASK),
        SCRAMBLED_TAG: buf.readUInt16LE(i.SCRAMBLED_TAG)
    }
}

function puzEncode(s, options) {
    const encoding = options && options.stripped ? STRIPPED_ENCODING : PUZ_ENCODING;
    return iconv.encode(s, encoding);
}

function decodeEmoji(url) {
    const map = new Mapping(ALL_EMOJIS);
    const runes = Array.from(url.split('\u{200D}')[0].split(/[\ufe00-\ufe0f]/).join(''))
    return runes.map(r => map.getId(r));
}

// http://blog.tatedavies.com/2012/08/28/replace-microsoft-chars-in-javascript/
/**
 * Replace Word characters with Ascii equivalent
 **/
function replaceWordChars(text) {
    var s = text;
    // smart single quotes and apostrophe
    s = s.replace(/[\u2018|\u2019|\u201A]/g, "\'");
    // smart double quotes
    s = s.replace(/[\u201C|\u201D|\u201E]/g, "\"");
    // ellipsis
    s = s.replace(/\u2026/g, "...");
    // dashes
    s = s.replace(/[\u2013|\u2014]/g, "-");
    // circumflex
    s = s.replace(/\u02C6/g, "^");
    // open angle bracket
    s = s.replace(/\u2039/g, "");
    // spaces
    s = s.replace(/[\u02DC|\u00A0]/g, " ");
    return s;
}

function puzDecode(buf, start, end, options) {
    const encoding = options && options.stripped ? STRIPPED_ENCODING : PUZ_ENCODING;
    const s = iconv.decode(buf.slice(start, end), encoding);
    return replaceWordChars(s);
}

function splitNulls(buf, options) {
    let i = 0;
    let prev = 0;
    let parts = [];
    while (i < buf.length) {
        if (buf[i] == 0x0) {
            parts.push(puzDecode(buf, prev, i, options));
            prev = i + 1;
        }
        i++;
    }
    if (i > prev)
        parts.push(puzDecode(buf, prev, i, options));
    return parts;
}

function checksum(base, c, len) {
  if (c === undefined)
    c = 0x0000;
  
  if (base === undefined)
    return c;

  if (len === undefined)
    len = base.length;

  for (let i = 0; i < len; i++) {
    if (c & 0x0001)
      c = ((c >>> 1) + 0x8000) & 0xFFFF;
    else
      c = (c >>> 1);
    c = (c + base[i]) & 0xFFFF;
  }
  return c;
}

function concatBytes(a, b) {
    let c = new Uint8Array(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
}

function writeCheatChecksum(buf, offset, key, checksums) {
    const n = checksums.length;
    for (let shift = 0; shift < 2; shift++) {
        for (let i = 0; i < checksums.length; i++) {
            const c = (checksums[i] & (0xFF << 8*shift)) >>> 8*shift;
            buf[offset + i + n*shift] = key.charCodeAt(i + n*shift) ^ c;
        }
    }
}

function writeUInt16LE(buf, offset, val) {
    buf[offset + 0] =  val & 0x00FF;
    buf[offset + 1] = (val & 0xFF00) >> 8;
}

class PuzPayload {
    static from(x, options) {
        const buf = Buffer.from(x);
        const stripped = options && options.stripped;
        let header = readHeader(buf, stripped);
        const ncells = header.WIDTH * header.HEIGHT;
        let pos = stripped ? STRIPPED_HEADER_CONSTANTS.lengths.HEADER : PUZ_HEADER_CONSTANTS.lengths.HEADER;
        const solution = puzDecode(buf, pos, pos + ncells, options);
        pos += ncells;
        var state = '';
        if (!stripped) {
            state = puzDecode(buf, pos, pos + ncells, options);
            pos += ncells;
        }
        const strings = splitNulls(buf.slice(pos), options);
        const fields = PUZ_STRING_FIELDS;
        const meta = {};
        fields.forEach(function(f, i) {
            meta[f] = strings[i];
        });
        meta.note = strings[fields.length + header.NUM_CLUES];
        meta.width = header.WIDTH;
        meta.height = header.HEIGHT;
        const clueStrings = strings.slice(fields.length, fields.length + header.NUM_CLUES);
        return new PuzPayload(meta, clueStrings, solution, state);
    }

    isBlackSquare(grid, row, col) {
        return grid[row*this.width + col] === PUZ_BLACK_SQUARE_CHAR;
    }

    acrossSoln(grid, row, col) {
        var pos = row * this.width + col;
        var soln = '';
        while (pos < (row + 1) * this.width) {
            if (grid[pos] == PUZ_BLACK_SQUARE_CHAR)
                break;
            soln += grid[pos];
            pos++;
        }
        return soln;
    }

    downSoln(grid, row, col) {
        var pos = row * this.width + col;
        var soln = '';
        while (pos < this.height * this.width) {
            if (grid[pos] === PUZ_BLACK_SQUARE_CHAR)
                break;
            soln += grid[pos];
            pos += this.width;
        }
        return soln;
    }

    parseClues() {
        var row, col;
        var number = 1;
        var clueIndex = 0;
        this.clues = [];
        const grid = this.solution;
        for (row = 0; row < this.height; row++) {
            for (col = 0; col < this.width; col++) {
                if (this.isBlackSquare(grid, row, col))
                    continue;
                var numbered = false;
                var isAcrossSpace, isDownSpace;
                var isAcrossClue = false;
                var isDownClue = false;
                var aSoln, dSoln;
                isAcrossSpace = col == 0 || this.isBlackSquare(grid, row, col - 1);
                aSoln = this.acrossSoln(grid, row, col);
                if (isAcrossSpace && aSoln.length > 1) {
                    numbered = true;
                    isAcrossClue = true;
                }
                isDownSpace = row == 0 || this.isBlackSquare(grid, row - 1, col);
                dSoln = this.downSoln(grid, row, col);
                if (isDownSpace && dSoln.length > 1) {
                    numbered = true;
                    isDownClue = true;
                }
                if (!numbered)
                    continue;

                // clues are arranged numerically, with across clues coming first
                if (isAcrossClue) {
                    const aState = this.acrossSoln(this.stateString, row, col);
                    const aText = this.clueStrings[clueIndex];
                    this.clues.push({
                        number: number,
                        text: aText,
                        solution: aSoln,
                        state: aState,
                        row: row,
                        col: col,
                        isDown: false,
                        length: aSoln.length
                    });
                    clueIndex++;
                }
                if (isDownClue) {
                    const dState = this.downSoln(this.stateString, row, col);
                    const dText = this.clueStrings[clueIndex];
                    this.clues.push({
                        number: number,
                        text: dText,
                        solution: dSoln,
                        state: dState,
                        row: row,
                        col: col,
                        isDown: true,
                        length: dSoln.length
                    });
                    clueIndex++;
                }
                number++;
            }
        }
        return this.clues;
    }

    buildStrings(options) {
        let strings = '';
        const fields = PUZ_STRING_FIELDS;
        
        for (let i = 0; i < fields.length; i++)
            strings += this[fields[i]] + '\x00';

        for (let i = 0; i < this.clueStrings.length; i++)
            strings += this.clueStrings[i] + '\x00';

        if (this.note)
            strings += this.note;

        /* need a null terminator even if notes are empty */
        strings += '\x00';

        return puzEncode(strings, options);
    }

    stringsChecksum(c) {
        c = checksum(puzEncode(this.title + '\x00'), c);
        c = checksum(puzEncode(this.author + '\x00'), c);
        c = checksum(puzEncode(this.copyright + '\x00'), c);
        for (let i = 0; i < this.clueStrings.length; i++)
            c = checksum(puzEncode(this.clueStrings[i]), c);

        if (this.note)
            c = checksum(puzEncode(this.note + '\x00'), c);
        return c;
    }

    buildBody(options) {
        let body = puzEncode(this.solution, options);
        if (!options.stripped) {
            body = concatBytes(body, puzEncode(this.stateString, options));
        }
        return concatBytes(body, this.buildStrings(options));
    }

    computeChecksums(header) {
        const p = PUZ_HEADER_CONSTANTS;
        const h = checksum(header.slice(p.offsets.WIDTH, p.lengths.HEADER));
        let c = checksum(puzEncode(this.solution), h);
        c = checksum(puzEncode(this.stateString), c);
        return {
            header: h,
            solution: checksum(puzEncode(this.solution)),
            state: checksum(puzEncode(this.stateString)),
            strings: this.stringsChecksum(),
            file: this.stringsChecksum(c)
        }
    }

    buildHeader(options) {
        if (options.stripped) {
            const i = STRIPPED_HEADER_CONSTANTS.offsets;
            const header = new Uint8Array(STRIPPED_HEADER_CONSTANTS.lengths.HEADER);
            header[i.WIDTH] = this.width;
            header[i.HEIGHT] = this.height;
            writeUInt16LE(header, i.NUM_CLUES, this.clueStrings.length);
            return header;
        }
        
        const i = PUZ_HEADER_CONSTANTS.offsets;
        const header = new Uint8Array(PUZ_HEADER_CONSTANTS.lengths.HEADER);

        // metadata
        header.set(iconv.encode("ACROSS&DOWN", "utf-8"), i.MAGIC);
        header.set(iconv.encode("1.3", "utf-8"), i.VERSION);

        // dimensions
        header[i.WIDTH] = this.width;
        header[i.HEIGHT] = this.height;
        writeUInt16LE(header, i.NUM_CLUES, this.clueStrings.length);

        // magical random bitmask, causes across lite to crash if not set :S
        header[i.UNKNOWN_BITMASK] = 0x01;

        // checksums
        const c = this.computeChecksums(header);
        writeUInt16LE(header, i.FILE_CHECKSUM, c.file);
        writeUInt16LE(header, i.HEADER_CHECKSUM, c.header);
        writeCheatChecksum(header, i.ICHEATED_CHECKSUM, "ICHEATED", [
            c.header, c.solution, c.stateString, c.strings
        ]);
        return header;
    }

    toBytes(stripped) {
        const options = {stripped: stripped}
        return concatBytes(this.buildHeader(options), this.buildBody(options));
    }

    toBuffer(stripped) {
        return Buffer.from(this.toBytes(stripped));
    }

    toCompressed(stripped) {
        const puzbytes = this.toBuffer(stripped)
        const bwt = forward_bwt(puzbytes);
        const compressed = MTFModel.compressFile(bwt);
        return compressed;
    }

    static fromCompressed(compressed, stripped) {
        const decompressed = MTFModel.decompressFile(compressed);
        const inv = inverse_bwt(Buffer.from(decompressed));
        return PuzPayload.from(inv, {stripped: stripped});
    }

    toURL(stripped) {
        return base64url(this.toCompressed(stripped))
    }

    static fromURL(url, stripped) {
        const compressed = base64url.toBuffer(url)
        return PuzPayload.fromCompressed(compressed, stripped);
    }

    toEmoji(stripped) {
        const map = new Mapping(ALL_EMOJIS);
        const compressed = this.toCompressed(stripped);
        const b1024 = convertBase(compressed, 8, 10, true);
        const emoji = b1024.map(i => map.getEmoji(i)).join('');
        return emoji;
    }

    static fromEmoji(s, stripped) {
        const b1024 = decodeEmoji(s);
        const compressed = Buffer.from(convertBase(b1024, 10, 8, false))
        return PuzPayload.fromCompressed(compressed, stripped);
    }
    
    constructor(metadata, clueStrings, solution, state) {
        for (let [field, value] of Object.entries(metadata)) {
            this[field] = value;
        }
        this.solution = solution;
        this.state = state;
        this.stateString = state;
        if (!this.stateString)
            this.stateString = this.solution.replace(/[^\.]/g, '-');
        this.clueStrings = clueStrings;
    }
}

module.exports = {
    PuzPayload: PuzPayload
}

