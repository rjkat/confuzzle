const iconv = require('iconv-lite');

// Strings in puz files are ISO-8859-1.

// From https://www.i18nqa.com/debug/table-iso8859-1-vs-windows-1252.html:
// ISO-8859-1 (also called Latin-1) is identical to Windows-1252 (also called CP1252)
// except for the code points 128-159 (0x80-0x9F). ISO-8859-1 assigns several control
// codes in this range. Windows-1252 has several characters, punctuation, arithmetic
// and business symbols assigned to these code points.
const PUZ_ENCODING = "ISO-8859-1";

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

// names of string fields
const PUZ_STRING_FIELDS = ['title', 'author', 'copyright'];

function puzDecode(buf, start, end, encoding) {
    if (!encoding)
        encoding = PUZ_ENCODING;
    const s = iconv.decode(buf.slice(start, end), encoding);
    return replaceWordChars(s);
}

function puzEncode(s, addNull, encoding) {
    if (!encoding)
        encoding = PUZ_ENCODING;
    const result = iconv.encode(replaceWordChars(s), encoding);
    if (addNull) {
        return Buffer.concat([result, Buffer.from([0])]);
    }
    return result;
}

function emptyState(soln) {
    return soln.replace(/[^\.]/g, '-');
}

/* allow for puzzles without state */
function puzState(puz) {
    return puz.state ? puz.state : emptyState(puz.solution);
}

function hasState(puz) {
    return puz.state != emptyState(puz.solution);
}

function splitNulls(buf, encoding) {
    let i = 0;
    let prev = 0;
    let parts = [];
    while (i < buf.length) {
        if (buf[i] == 0x0) {
            parts.push(puzDecode(buf, prev, i, encoding));
            prev = i + 1;
        }
        i++;
    }
    if (i > prev)
        parts.push(puzDecode(buf, prev, i, encoding));
    return parts;
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

function concatBytes(a, b) {
    let c = new Uint8Array(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
}

function writeUInt16LE(buf, offset, val) {
    buf[offset + 0] =  val & 0x00FF;
    buf[offset + 1] = (val & 0xFF00) >> 8;
}

module.exports = {
    PUZ_ENCODING: PUZ_ENCODING,
    PUZ_HEADER_CONSTANTS: PUZ_HEADER_CONSTANTS,
    PUZ_STRING_FIELDS: PUZ_STRING_FIELDS,
    puzDecode: puzDecode,
    puzEncode: puzEncode,
    puzState: puzState,
    hasState: hasState,
    emptyState: emptyState,
    concatBytes: concatBytes,
    splitNulls: splitNulls,
    writeUInt16LE: writeUInt16LE
}
