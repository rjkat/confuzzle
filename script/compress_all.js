const fs = require('fs');
const path = require('path');
const puz = require('../client/js/puz.js');

function compress_puz(puz_file) {
    const payload = puz.PuzPayload.from(fs.readFileSync(puz_file));
    const emoji = payload.toEmoji(true);
    const decoded = puz.PuzPayload.fromEmoji(emoji);
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
