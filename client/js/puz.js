// https://github.com/tedtate/puzzler/blob/master/lib/crossword.js

// http://code.google.com/p/puz/wiki/FileFormat
function readHeader(buf) {
    const b = (offset, len) => buf.slice(offset, offset + len)
    return {
        checksum: b(0x00, 0x02).readInt16LE(),
        fileMagic: b(0x02, 0x0B).toString(),
        checksums: {
            cib: b(0x0E, 0x02).readInt16LE(),
            low: b(0x10, 0x04).toString('hex'),
            high: b(0x14, 0x04).toString('hex')
        },
        version: b(0x18, 0x04).toString(),
        reserved1C: b(0x1C, 0x02).toString('hex'),
        scrambledChecksum: b(0x1E, 0x02).readInt16LE(),
        reserved20: b(0x20, 0x0C).toString('hex'),
        width: b(0x2C, 0x01).readInt8(),
        height: b(0x2D, 0x01).readInt8(),
        numClues: b(0x2E, 0x02).readInt16LE(),
        unknownBitmask: b(0x30, 0x02).readInt16LE(),
        scambledTag: b(0x32, 0x02).readInt16LE()
    }
}

export function readPuz(buf) {
    var header = readHeader(buf);
    const ncells = header.width * header.height;
    const b = (offset, len) => buf.slice(offset, offset + len).toString();
    var pos = 0x34;
    const solution = b(pos, ncells);
    pos += ncells;
    const state = b(pos, ncells);
    pos += ncells;
    const parts = buf.slice(pos).toString().split('\u0000');
    const fields = ['title', 'author', 'copyright'];
    fields.forEach(function(f, i) {
        if (i < parts.length)
            header[f] = parts[i];
    });
    const clues = parts.slice(fields.length);
    return {
        header: header,
        clues: clues,
        solution: solution,
        state: state
    }
}
