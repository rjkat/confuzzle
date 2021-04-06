const puz_common = require('@confuzzle/puz-common');
const iconv = require('iconv-lite');

// http://code.google.com/p/puz/wiki/FileFormat
// https://github.com/tedtate/puzzler/blob/master/lib/crossword.js
function readHeader(buf) {
    const i = puz_common.PUZ_HEADER_CONSTANTS.offsets;
    const n = puz_common.PUZ_HEADER_CONSTANTS.lengths;
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

function readpuz(x) {
    const buf = Buffer.from(x);
    let header = readHeader(buf);
    const ncells = header.WIDTH * header.HEIGHT;
    
    let pos = puz_common.PUZ_HEADER_CONSTANTS.lengths.HEADER;
    const puz = {};
    
    puz.solution = puz_common.puzDecode(buf, pos, pos + ncells);
    pos += ncells;
    
    puz.state = puz_common.puzDecode(buf, pos, pos + ncells);
    pos += ncells;
    
    const strings = puz_common.splitNulls(buf.slice(pos));
    const fields = puz_common.PUZ_STRING_FIELDS;
    for (let i = 0; i < fields.length; i++) {
        const name = fields[i];
        puz[name] = strings[i];
        pos += strings[i].length + 1;
    }

    puz.width = header.WIDTH;
    puz.height = header.HEIGHT;
    puz.clues = strings.slice(fields.length, fields.length + header.NUM_CLUES);
    puz.note = strings[fields.length + header.NUM_CLUES];
    puz.hasState = puz_common.hasState(puz);

    /*  
     * Component    Length (bytes)         Description
     * Title           0x04            The name of the section
     * Length          0x02            The length of the data section, in bytes, not counting the null terminator
     * Checksum        0x02            A checksum of the data section
     * Data            variable        The data, which varies in format but is always terminated by null and has the specified length
    */
    puz.sections = [];
    for (let i = 0; i < puz.clues.length; i++) {
        pos += puz.clues[i].length + 1;
    }
    pos += 1;
    while ((pos + 8) < buf.length) {
        const title = buf.toString('utf8', pos, pos + 4);
        const len = buf.readUInt16LE(pos + 4);
        const checksum = buf.readUInt16LE(pos + 6);
        let data = null;
        if (title == 'RTBL' || title == 'LTIM') {
            data = buf.toString('utf8', pos + 8, pos + 8 + len);
        } else {
            data = new Uint8Array(buf.slice(pos + 8, pos + 8 + len));
        }
        puz.sections.push({
            title: title,
            data: data,
            checksum: checksum
        });
        pos += 8 + len + 1;
    }

    return puz;
}

module.exports = {
    readpuz: readpuz
};
