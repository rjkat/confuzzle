
// https://en.wikipedia.org/wiki/Move-to-front_transform
function forward_mtf(s) {
    const buf = Buffer.from(s);
    const dict = [...Array(256).keys()];
    const t = [];
    for (var i = 0; i < buf.length; i++) {
        const c = buf[i];
        const rank = dict.indexOf(c);
        if (rank == -1) {
            console.log(c);
            console.log(dict);
        }
        t.push(rank);
        dict.splice(rank, 1);
        dict.splice(0, 0, c);
    }
    return Buffer.from(t);
}

function inverse_mtf(t) {
    const dict = [...Array(256).keys()];
    const s = [];
    for (var i = 0; i < t.length; i++) {
        const rank = t[i];
        s.push(dict[rank]);
        const e = dict[rank];
        dict.splice(rank, 1);
        dict.splice(0, 0, e);
    }
    return Buffer.from(s);
}

module.exports = {
    forward: forward_mtf,
    inverse: inverse_mtf
}
