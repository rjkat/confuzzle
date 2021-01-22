
const fs = require('fs');
const path = require('path');
const ShareablePuz = require('../@confuzzle/puz-sharing').ShareablePuz;
const confuz = require('../@confuzzle/confuz-crossword/confuz');

const QRCode = require('qrcode');

const source = path.join(__dirname, '..', 'test', 'puzfiles', 'nyt_weekday_with_notes.puz');
const buf = fs.readFileSync(source);
const puz = ShareablePuz.from(buf);
const params = puz.toURL();
const puz2 = confuz.fromPuz(ShareablePuz.fromURL(params));
const url = 'https://confuzzle.app?puz=' + puz.toURL()

QRCode.toFile('foo.png', [{data: url}])

 
