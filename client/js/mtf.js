
// https://en.wikipedia.org/wiki/Move-to-front_transform
export function forward_mtf(s) {
    const buf = Buffer.from(s);
    const dict = [...Array(256).keys()];
    const t = [];
    for (var i = 0; i < buf.length; i++) {
        const c = buf[i];
        const rank = dict.indexOf(c);
        t.push(rank);
        dict.splice(0, 1, rank);
        dict.splice(0, 0, c);
    }
    return Buffer.from(t);
}

export function inverse_mtf(t) {
    const dict = [...Array(256).keys()];
    const s = [];
    for (var i = 0; i < t.length; i++) {
        const rank = t[i];
        s.push(dict[rank]);
        const e = dict[rank];
        dict.splice(0, 1, rank);
        dict.splice(0, 0, e);
    }
    return Buffer.from(s);
}
