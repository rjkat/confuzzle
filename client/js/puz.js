const iconv = require('iconv-lite');


// strings in puz files are ISO-8859-1
const PUZ_ENCODING = "ISO-8859-1";

// http://code.google.com/p/puz/wiki/FileFormat
// https://github.com/tedtate/puzzler/blob/master/lib/crossword.js
function readHeader(buf) {
    return {
        fileChecksum: buf.readUInt16LE(0x00),
        fileMagic: buf.toString('utf8', 0x02, 0x02 + 0x0B),
        checksums: {
            cib: buf.readUInt16LE(0x0E),
            low: buf.readUInt32LE(0x10),
            high: buf.readUInt32LE(0x14)
        },
        version: buf.toString('utf8', 0x18, 0x18 + 0x04),
        reserved1C: buf.readUInt16LE(0x1C),
        scrambledChecksum: buf.readUInt16LE(0x1E),
        reserved20: buf.toString('hex', 0x20, 0x20 + 0x0C),
        width: buf.readUInt8(0x2C),
        height: buf.readUInt8(0x2D),
        numClues: buf.readUInt16LE(0x2E),
        unknownBitmask: buf.readUInt16LE(0x30),
        scrambledTag: buf.readUInt16LE(0x32)
    }
}

function stringSlice(buf, start, end) {
    return iconv.decode(buf.slice(start, end), PUZ_ENCODING);
}

function splitNulls(buf) {
    var i = 0;
    var prev = 0;
    var parts = [];
    while (i < buf.length) {
        if (buf[i] == 0x0) {
            parts.push(stringSlice(buf, prev, i));
            prev = i + 1;
        }
        i++;
    }
    if (i > prev)
        parts.push(stringSlice(buf, prev, i));
    return parts;
}

export function readPuz(buf) {
    var header = readHeader(buf);
    const ncells = header.width * header.height;
    var pos = 0x34;
    const solution = stringSlice(buf, pos, pos + ncells);
    pos += ncells;
    const state = stringSlice(buf, pos, pos + ncells);
    pos += ncells;
    const parts = splitNulls(buf.slice(pos));
    const fields = ['title', 'author', 'copyright'];
    var puz = {
        header: header,
        width: header.width,
        height: header.height,
        clues: parts.slice(fields.length, fields.length + header.numClues),
        note: parts[fields.length + header.numClues],
        solution: solution,
        state: state
    }
    fields.forEach(function(f, i) {
        puz[f] = parts[i];
    });
    return puz;
}

function buildStrings(puz) {
    var body = '';
    const names = ['title', 'author', 'copyright'];
    for (var i = 0; i < names.length; i++) {
        body += puz[names[i]] + '\x00';
    }
    for (var i = 0; i < puz.clues.length; i++) {
        body += puz.clues[i] + '\x00';
    }
    if (puz.note) {
        body += puz.note + '\x00';
    }
    return puzEncode(body);
}

function checksum(base, cksum, len) {
  if (cksum === undefined)
    cksum = 0x0000;
  
  if (base === undefined)
    return cksum;

  if (len === undefined)
    len = base.length;

  for (var i = 0; i < len; i++) {
    if (cksum & 0x0001)
      cksum = ((cksum >>> 1) + 0x8000) & 0xFFFF;
    else
      cksum = (cksum >>> 1);
    cksum = (cksum + base[i]) & 0xFFFF;
  }
  return cksum;
}

function puzChecksum(puz, cksum) {
    cksum = checksum(puzEncode(puz.title + '\x00'), cksum);
    cksum = checksum(puzEncode(puz.author + '\x00'), cksum);
    cksum = checksum(puzEncode(puz.copyright + '\x00'), cksum);
    for (var i = 0; i < puz.clues.length; i++) {
        cksum = checksum(puzEncode(puz.clues[i]), cksum);
    }
    if (puz.note)
        cksum = checksum(puzEncode(puz.note + '\x00'), cksum);
    return cksum;
}

// why does this not already exist in javascript
function concatBytes(a, b) {
    var c = new Uint8Array(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
}

function buildPuzBody(puz) {
    var body = puzEncode(puz.solution);
    if (!puz.state) {
        puz.state = puz.solution.replace(/[^\.]/g, '-');
    }
    body = concatBytes(body, puzEncode(puz.state));
    var strings = buildStrings(puz);
    body = concatBytes(body, strings);
    return body;
}

/* puz should have same fields as returned by readPuz, except for header. 
   state and note are optional. */
export function writePuz(puz) {
    const header = new Uint8Array(0x34);
    const body = buildPuzBody(puz);

    // magic
    header.set(iconv.encode("ACROSS&DOWN", "utf-8"), 0x02);
    
    // version
    header.set(iconv.encode("1.3", "utf-8"), 0x18);

    // dimensions
    header[0x2C] = puz.width;
    header[0x2D] = puz.height;
    header[0x2E] = puz.clues.length & 0xFF;
    header[0x2F] = (puz.clues.length & 0xFF00) >> 8;

    // magical random bitmask, causes across lite to crash if not set :S
    header[0x30] = 0x01
    
    // checksums
    var c_cib = checksum(header.slice(0x2C), 0, 8);
    var c_sol = checksum(puzEncode(puz.solution));
    var c_grid = checksum(puzEncode(puz.state));
    var c_part = puzChecksum(puz);
 
    var c_puz = checksum(puzEncode(puz.solution), c_cib);
    c_puz = checksum(puzEncode(puz.state), c_puz);
    c_puz = puzChecksum(puz, c_puz);

    header[0x00] = c_puz & 0xFF;
    header[0x01] = (c_puz & 0xFF00) >> 8;

    header[0x0E] = c_cib & 0xFF;
    header[0x0F] = (c_cib & 0xFF00) >> 8;

    header[0x10] = 0x49 ^ (c_cib & 0xFF);
    header[0x11] = 0x43 ^ (c_sol & 0xFF);
    header[0x12] = 0x48 ^ (c_grid & 0xFF);
    header[0x13] = 0x45 ^ (c_part & 0xFF);

    header[0x14] = 0x41 ^ ((c_cib & 0xFF00) >> 8);
    header[0x15] = 0x54 ^ ((c_sol & 0xFF00) >> 8);
    header[0x16] = 0x45 ^ ((c_grid & 0xFF00) >> 8);
    header[0x17] = 0x44 ^ ((c_part & 0xFF00) >> 8);

    // const parsed = readHeader(Buffer.from(header));
    // console.log(JSON.stringify(parsed));

    return concatBytes(header, body);
}

function puzEncode(s) {
    return iconv.encode(s, PUZ_ENCODING);
}

