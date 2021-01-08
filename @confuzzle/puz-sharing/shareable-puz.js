const puz_common = require('@confuzzle/puz-common');
const readpuz = require('@confuzzle/readpuz').readpuz;
const PuzCrossword = require('@confuzzle/puz-crossword').PuzCrossword;

const ecoji = require('@confuzzle/ecoji-buffers');
const base64url = require("base64url");

const mtf = require('./transforms/mtf');
const bwt = require('./transforms/bwt');
const rc = require('@thi.ng/range-coder');

const PUZZLE_EMOJI_MAGIC = '🧩✨0️⃣'

const COMPRESSED_ENCODING = "utf-8";
const COMPRESSED_HEADER_CONSTANTS = {
    offsets: {
        WIDTH: 0x00,
        HEIGHT: 0x01,
        NUM_CLUES: 0x02,
    },
    lengths: {
        HEADER: 0x04
    }
};

function buildHeader(puz) {
    const i = COMPRESSED_HEADER_CONSTANTS.offsets;
    const header = new Uint8Array(COMPRESSED_HEADER_CONSTANTS.lengths.HEADER);
    header[i.WIDTH] = puz.width;
    header[i.HEIGHT] = puz.height;
    puz_common.writeUInt16LE(header, i.NUM_CLUES, puz.clues.length);
    return header;
}

function enc(s) {
    return puz_common.puzEncode(s, COMPRESSED_ENCODING);
}

function buildStrings(puz) {
    let strings = '';
    const fields = puz_common.PUZ_STRING_FIELDS;

    for (let i = 0; i < fields.length; i++)
        strings += enc(puz[fields[i]]) + '\x00';

    for (let i = 0; i < puz.clues.length; i++)
        strings += enc(puz.clues[i]) + '\x00';

    if (puz.note)
        strings += enc(puz.note);

    /* need a null terminator even if notes are empty */
    strings += '\x00';

    return puz_common.puzEncode(strings, COMPRESSED_ENCODING);
}

function buildBody(puz) {
    let body = puz_common.puzEncode(puz.solution, COMPRESSED_ENCODING);
    return puz_common.concatBytes(body, buildStrings(puz));
}

function writecompressed(puz) {
    return puz_common.concatBytes(buildHeader(puz), buildBody(puz));
}

function readHeader(buf) {
    const x = COMPRESSED_HEADER_CONSTANTS.offsets;
    return {
        WIDTH: buf.readUInt8(x.WIDTH),
        HEIGHT: buf.readUInt8(x.HEIGHT),
        NUM_CLUES: buf.readUInt16LE(x.NUM_CLUES)
    }
}

function readcompressed(x) {
    const buf = Buffer.from(x);
    let header = readHeader(buf);
    const ncells = header.WIDTH * header.HEIGHT;
    
    let pos = COMPRESSED_HEADER_CONSTANTS.lengths.HEADER;
    const puz = {};
    
    puz.solution = puz_common.puzDecode(buf, pos, pos + ncells, COMPRESSED_ENCODING);
    pos += ncells;
    
    /* no state */
    puz.state = '';
    
    const strings = puz_common.splitNulls(buf.slice(pos), COMPRESSED_ENCODING);
    console.log(strings[4]);
    const fields = puz_common.PUZ_STRING_FIELDS;
    for (let i = 0; i < fields.length; i++) {
        const name = fields[i];
        puz[name] = strings[i];
    }

    puz.width = header.WIDTH;
    puz.height = header.HEIGHT;
    puz.clues = strings.slice(fields.length, fields.length + header.NUM_CLUES);
    puz.note = strings[fields.length + header.NUM_CLUES];

    return puz;
}

class ShareablePuz extends PuzCrossword {
    static from(x) {
        return new ShareablePuz(readpuz(x));
    }

    toEmoji() {
        const compressed = this.toCompressed();
        return PUZZLE_EMOJI_MAGIC + ecoji.encode(compressed);
    }

    static fromEmoji(s) {
        const compressed = ecoji.decode(s.slice(PUZZLE_EMOJI_MAGIC.length));
        return ShareablePuz.fromCompressed(compressed);
    }

    toCompressed() {
        const s = writecompressed(this);
        const t = bwt.forward(s);
        const m = mtf.forward(t);
        const x = rc.encodeBytes(m);
        return x;
    }

    static fromCompressed(x) {
        const m = rc.decodeBytes(x);
        const t = mtf.inverse(m);
        const s = bwt.inverse(t);
        return new ShareablePuz(readcompressed(s));
    }

    toURL() {
        return base64url(this.toCompressed());
    }

    static fromURL(url) {
        const compressed = base64url.toBuffer(url);
        return ShareablePuz.from(compressed);
    }

    constructor(puz) {
        super(puz);
    }
}

module.exports = {
    ShareablePuz: ShareablePuz
};

