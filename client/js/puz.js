const iconv = require('iconv-lite');

// strings in puz files are ISO-8859-1
const PUZ_ENCODING = "ISO-8859-1";

const PUZ_HEADER_CONSTANTS = {
    offsets: {
        FILE_CHECKSUM: 0x00,
        MAGIC: 0x02,
        CIB_CHECKSUM: 0x0E,
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
    }
}

// http://code.google.com/p/puz/wiki/FileFormat
// https://github.com/tedtate/puzzler/blob/master/lib/crossword.js
function readHeader(buf) {
    const h = PUZ_HEADER_CONSTANTS.offsets;
    const l = PUZ_HEADER_CONSTANTS.lengths;
    return {
        FILE_CHECKSUM: buf.readUInt16LE(h.FILE_CHECKSUM),
        MAGIC: buf.toString('utf8', h.MAGIC, h.MAGIC + l.MAGIC),
        CIB_CHECKSUM: buf.readUInt16LE(h.CIB_CHECKSUM),
        ICHEATED_CHECKSUM: buf.toString('hex', h.ICHEATED_CHECKSUM, h.ICHEATED_CHECKSUM + l.ICHEATED_CHECKSUM),
        VERSION: buf.toString('utf8', h.VERSION, h.VERSION + l.VERSION),
        RES1: buf.readUInt16LE(h.RES1),
        SCRAMBLED_CHECKSUM: buf.readUInt16LE(h.SCRAMBLED_CHECKSUM),
        RES2: buf.toString('hex', h.RES2, h.RES2 + l.RES2),
        WIDTH: buf.readUInt8(h.WIDTH),
        HEIGHT: buf.readUInt8(h.HEIGHT),
        NUM_CLUES: buf.readUInt16LE(h.NUM_CLUES),
        UNKNOWN_BITMASK: buf.readUInt16LE(h.UNKNOWN_BITMASK),
        SCRAMBLED_TAG: buf.readUInt16LE(h.SCRAMBLED_TAG)
    }
}

function puzEncode(s) {
    return iconv.encode(s, PUZ_ENCODING);
}

function puzDecode(buf, start, end) {
    return iconv.decode(buf.slice(start, end), PUZ_ENCODING);
}

function splitNulls(buf) {
    var i = 0;
    var prev = 0;
    var parts = [];
    while (i < buf.length) {
        if (buf[i] == 0x0) {
            parts.push(puzDecode(buf, prev, i));
            prev = i + 1;
        }
        i++;
    }
    if (i > prev)
        parts.push(puzDecode(buf, prev, i));
    return parts;
}

function checksum(base, ck, len) {
  if (ck === undefined)
    ck = 0x0000;
  
  if (base === undefined)
    return ck;

  if (len === undefined)
    len = base.length;

  for (var i = 0; i < len; i++) {
    if (ck & 0x0001)
      ck = ((ck >>> 1) + 0x8000) & 0xFFFF;
    else
      ck = (ck >>> 1);
    ck = (ck + base[i]) & 0xFFFF;
  }
  return ck;
}

function concatBytes(a, b) {
    var c = new Uint8Array(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
}

function writeCheatChecksum(buf, offset, key, checksums) {
    const n = checksums.length;
    for (var shift = 0; shift < 2; shift++) {
        for (var i = 0; i < checksums.length; i++) {
            const c = (checksums[i] & (0xFF << 8*shift)) >>> 8*shift;
            buf[offset + i + n*shift] = key.charCodeAt(i + n*shift) ^ c;
        }
    }
}

function writeUInt16LE(buf, offset, val) {
    buf[offset + 0] =  val & 0x00FF;
    buf[offset + 1] = (val & 0xFF00) >> 8;
}

export class PuzPayload {
    static from(x) {
        const buf = Buffer.from(x);
        var header = readHeader(buf);
        const ncells = header.WIDTH * header.HEIGHT;
        var pos = PUZ_HEADER_CONSTANTS.lengths.HEADER;
        const solution = puzDecode(buf, pos, pos + ncells);
        pos += ncells;
        const state = puzDecode(buf, pos, pos + ncells);
        pos += ncells;
        const parts = splitNulls(buf.slice(pos));
        const fields = ['title', 'author', 'copyright'];
        const metadata = {};
        fields.forEach(function(f, i) {
            metadata[f] = parts[i];
        });
        metadata.note = parts[fields.length + header.NUM_CLUES];
        metadata.width = header.WIDTH;
        metadata.height = header.HEIGHT;
        const clues = parts.slice(fields.length, fields.length + header.NUM_CLUES);
        return new PuzPayload(metadata, clues, solution, state);
    }

    buildStrings() {
        var body = '';
        const names = ['title', 'author', 'copyright'];
        for (var i = 0; i < names.length; i++)
            body += this[names[i]] + '\x00';

        for (var i = 0; i < this.clues.length; i++)
            body += this.clues[i] + '\x00';

        if (this.note)
            body += this.note + '\x00';

        return puzEncode(body);
    }

    stringsChecksum(ck) {
        ck = checksum(puzEncode(this.title + '\x00'), ck);
        ck = checksum(puzEncode(this.author + '\x00'), ck);
        ck = checksum(puzEncode(this.copyright + '\x00'), ck);
        for (var i = 0; i < this.clues.length; i++)
            ck = checksum(puzEncode(this.clues[i]), ck);

        if (this.note)
            ck = checksum(puzEncode(this.note + '\x00'), ck);
        return ck;
    }

    buildBody() {
        var body = puzEncode(this.solution);
        if (!this.state)
            this.state = this.solution.replace(/[^\.]/g, '-');

        body = concatBytes(body, puzEncode(this.state));
        var strings = this.buildStrings();
        body = concatBytes(body, strings);
        return body;
    }

    computeChecksums(header) {
        const c = PUZ_HEADER_CONSTANTS;
        const cib = checksum(header.slice(c.offsets.WIDTH, c.lengths.HEADER));
        let ck = checksum(puzEncode(this.solution), cib);
        ck = checksum(puzEncode(this.state), ck);
        return {
            cib: cib,
            solution: checksum(puzEncode(this.solution)),
            state: checksum(puzEncode(this.state)),
            strings: this.stringsChecksum(),
            file: this.stringsChecksum(ck)
        }
    }

    toBytes() {
        const h = PUZ_HEADER_CONSTANTS.offsets;
        const l = PUZ_HEADER_CONSTANTS.lengths;
        const header = new Uint8Array(l.HEADER);
        const body = this.buildBody();

        // metadata
        header.set(iconv.encode("ACROSS&DOWN", "utf-8"), h.MAGIC);
        header.set(iconv.encode("1.3", "utf-8"), h.VERSION);

        // dimensions
        header[h.WIDTH] = this.width;
        header[h.HEIGHT] = this.height;
        writeUInt16LE(header, h.NUM_CLUES, this.clues.length);

        // magical random bitmask, causes across lite to crash if not set :S
        header[h.UNKNOWN_BITMASK] = 0x01;

        // checksums
        const ck = this.computeChecksums(header);
        writeUInt16LE(header, h.FILE_CHECKSUM, ck.file);
        writeUInt16LE(header, h.CIB_CHECKSUM, ck.cib);
        writeCheatChecksum(header, h.ICHEATED_CHECKSUM, "ICHEATED", [
            ck.cib, ck.solution, ck.state, ck.strings
        ]);

        return concatBytes(header, body);
    }

    toBuffer() {
        return Buffer.from(this.toBytes());
    }

    /* state is optional */
    constructor(metadata, clues, solution, state) {
        for (let [field, value] of Object.entries(metadata)) {
            this[field] = value;
        }
        this.clues = clues;
        this.solution = solution;
        this.state = state;
    }
}

