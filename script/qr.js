
const fs = require('fs');
const path = require('path');
const ShareablePuz = require('../@confuzzle/puz-sharing').ShareablePuz;

const QRCode = require('qrcode');

const source = 'test.puz';
const buf = fs.readFileSync(source);
const puz = ShareablePuz.from(buf);
const params = puz.toURL();
const url = 'https://confuzzle.app?puz=' + puz.toURL()

console.log(url.length)

QRCode.toFile('foo.png', [{data: url}])

 
