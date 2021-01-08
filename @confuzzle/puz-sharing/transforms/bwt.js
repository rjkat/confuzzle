
// https://en.wikipedia.org/wiki/Burrows%E2%80%93Wheeler_transform
// https://www.cs.princeton.edu/courses/archive/spring03/cos226/assignments/burrows.html

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

function bufBytes(buf) {
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
}

function bufRotate(buf) {
    return Buffer.concat([
        Buffer.from([buf[buf.length - 1]]),
        buf.slice(0, buf.length - 1)
    ]);
}

function compareArrays(a, b) {
    var i = 0;
    while (i < a.length && a[i] == b[i]) {
        i++;
    }
    return a[i] - b[i];
}

function forward_bwt(s) {
    var rows = [];
    var buf = Buffer.from(s);
    var orig = buf.slice();
    for (var i = 0; i < buf.length; i++) {
        // rotate
        rows.push(buf);
        buf = bufRotate(buf);
    }
    rows.sort(compareArrays);
    var t = [];
    var index = -1;
    for (var i = 0; i < rows.length; i++) {
        if (rows[i].equals(orig))
            index = i;
        t.push(rows[i][rows[i].length - 1]);
    }
    const packedLen = new Uint8Array(2);
    writeUInt16LE(packedLen, 0, index);
    buf = Buffer.from(t);
    return concatBytes(packedLen, bufBytes(buf));
}

function get_next(t) {
    const firstCol = t.slice().sort();
    const next = [];
    const minNext = {};
    for (var i = 0; i < firstCol.length; i++) {
        const start = minNext[firstCol[i]] ? minNext[firstCol[i]] : 0; 
        for (var j = start; j < t.length; j++) {
            if (t[j] == firstCol[i]) {
                next.push(j);
                minNext[firstCol[i]] = j + 1;
            }
        }
    }
    return next;
}

function inverse_bwt(xfm) {
    const buf = Buffer.from(xfm);
    const index = buf.readUInt16LE(0);
    const t = bufBytes(buf.slice(2));
    const next = get_next(t);
    var x = index;
    var inv = []
    for (var i = 0; i < t.length; i++) {
        x = next[x];
        inv.push(t[x]);
    }
    return Buffer.from(inv);
}

module.exports = {
    forward: forward_bwt,
    inverse: inverse_bwt
}
