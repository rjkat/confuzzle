const fs = require('fs');
const path = require('path');

const puz = require('../client/js/puz.js');
require('../client/js/puz_compression.js');
const compressjs = require('compressjs');

const buffer = require('buffer');

const emojicoding = require('emojicoding');
const ALL_EMOJIS = require('./node_modules/ecoji-js/dist/src/emojis.js').default;
const EmojiMap = require('./node_modules/ecoji-js/dist/src/Mapping.js').default;

const EMOJI_MAP = new EmojiMap(ALL_EMOJIS);

function decodeEmoji(url) {
    const runes = Array.from(url.split('\u{200D}')[0].split(/[\ufe00-\ufe0f]/).join(''))
    return runes.map(r => EMOJI_MAP.getId(r));
}

function compress_puz(puz_file) {
    const payload = puz.PuzPayload.from(fs.readFileSync(puz_file));
    const emoji = payload.toEmoji(true);
    const decoded = puz.PuzPayload.fromEmoji(emoji);
    // console.log(decoded);
    // const stripped = true;
    // const puzbytes = payload.toBuffer(stripped);
    // const algorithm = compressjs.MTFModel;
    // const compressed = Buffer.from(algorithm.compressFile(puzbytes));
    // const b1024 = emojicoding.convertBase(compressed, 8, 10, true);
    // const emoji = b1024.map(i => EMOJI_MAP.getEmoji(i));
    // const url = emoji.join('');
    // const decoded_b1024 = decodeEmoji(url);
    // const decoded_compressed = Buffer.from(emojicoding.convertBase(decoded_b1024, 10, 8, false))
    // const decompressed = algorithm.decompressFile(decoded_compressed);
    // console.log(puz.PuzPayload.from(decompressed, {stripped: stripped}).toBuffer(true).toString())
}

compress_puz("foo.puz");

// const dir = process.argv[2];
function compress_all(dir) {
    fs.readdir(dir, function (err, files) {
        if (err) {
            console.log(err);
        }
        files.forEach(function(source) {
            if (!source.endsWith('.puz'))
                return;
            if (fs.existsSync(outname))
                return;

            const cw = JSON.parse(fs.readFileSync(path.join(dir, source), 'utf8').toString());

            fs.writeFileSync(outname, eno);
        })
    });
}
