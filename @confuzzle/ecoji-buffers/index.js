// derived from ecoji-js Copyright (c) 2019 Dmytro Borysovskyi
// used here under the Apache License 2.0
// https://github.com/dimabory/ecoji-js

const convertBase = require('./emojicoding').convertBase;
const EMOJI_MAP = require('./ecoji').EMOJI_MAP;

function encode(s) {
    const b1024 = convertBase(s, 8, 10, true);
    const emoji = b1024.map(i => EMOJI_MAP.getEmoji(i)).join('');
    return emoji;
}

function decode(t) {
    const runes = Array.from(t.split('\u{200D}')[0].split(/[\ufe00-\ufe0f]/).join(''))
    const b1024 = runes.map(r => EMOJI_MAP.getId(r));
    const s = Buffer.from(convertBase(b1024, 10, 8, false))
    return s;
}

module.exports = {
    encode: encode,
    decode: decode
}