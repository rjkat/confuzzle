const puz_common = require('@confuzzle/puz-common');
const iconv = require('iconv-lite');

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

function writeCheatChecksum(buf, offset, key, checksums) {
    const n = checksums.length;
    for (let shift = 0; shift < 2; shift++) {
        for (let i = 0; i < checksums.length; i++) {
            const c = (checksums[i] & (0xFF << 8*shift)) >>> 8*shift;
            buf[offset + i + n*shift] = key.charCodeAt(i + n*shift) ^ c;
        }
    }
}

const enc = puz_common.puzEncode;

function buildStrings(puz) {
    let strings = '';
    const fields = puz_common.PUZ_STRING_FIELDS;

    for (let i = 0; i < fields.length; i++)
        strings += puz[fields[i]] + '\x00';

    for (let i = 0; i < puz.clues.length; i++)
        strings += puz.clues[i] + '\x00';

    if (puz.note)
        strings += puz.note;

    /* need a null terminator even if notes are empty */
    strings += '\x00';

    return enc(strings);
}

function stringsChecksum(puz, c) {
    c = checksum(enc(puz.title + '\x00'), c);
    c = checksum(enc(puz.author + '\x00'), c);
    c = checksum(enc(puz.copyright + '\x00'), c);
    for (let i = 0; i < puz.clues.length; i++)
        c = checksum(enc(puz.clues[i]), c);

    if (puz.note)
        c = checksum(enc(puz.note + '\x00'), c);
    return c;
}

function buildBody(puz) {
    let body = enc(puz.solution);
    body = puz_common.concatBytes(body, enc(puz_common.puzState(puz)));
    return puz_common.concatBytes(body, buildStrings(puz));
}

function computeChecksums(puz, header) {
    const p = puz_common.PUZ_HEADER_CONSTANTS;
    const h = checksum(header.slice(p.offsets.WIDTH, p.lengths.HEADER));
    let c = checksum(enc(puz.solution), h);
    const state = puz_common.puzState(puz);
    c = checksum(enc(state), c);
    return {
        header: h,
        solution: checksum(enc(puz.solution)),
        state: checksum(enc(state)),
        strings: stringsChecksum(puz),
        file: stringsChecksum(puz, c)
    }
}

function buildHeader(puz) {
    const i = puz_common.PUZ_HEADER_CONSTANTS.offsets;
    const header = new Uint8Array(puz_common.PUZ_HEADER_CONSTANTS.lengths.HEADER);

    // metadata
    header.set(iconv.encode("ACROSS&DOWN", "utf-8"), i.MAGIC);
    header.set(iconv.encode("1.3", "utf-8"), i.VERSION);

    // dimensions
    header[i.WIDTH] = puz.width;
    header[i.HEIGHT] = puz.height;
    puz_common.writeUInt16LE(header, i.NUM_CLUES, puz.clues.length);

    // magical random bitmask, causes across lite to crash if not set :S
    header[i.UNKNOWN_BITMASK] = 0x01;

    // checksums
    const c = computeChecksums(puz, header);
    puz_common.writeUInt16LE(header, i.FILE_CHECKSUM, c.file);
    puz_common.writeUInt16LE(header, i.HEADER_CHECKSUM, c.header);
    writeCheatChecksum(header, i.ICHEATED_CHECKSUM, "ICHEATED", [
        c.header, c.solution, c.state, c.strings
    ]);
    return header;
}

function writepuz(puz) {
    return puz_common.concatBytes(buildHeader(puz), buildBody(puz));
}

module.exports = {
    writepuz: writepuz
};

