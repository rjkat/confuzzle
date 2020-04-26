const fs = require('fs');
const path = require('path');
import {readEno, enoToPuz} from '../client/js/eno.js';
import {writePuz} from '../client/js/puz.js';

test('weekday', () => {
    const source = path.join(__dirname, 'puzfiles', 'nyt_weekday_with_notes.puz');
    const buf = fs.readFileSync(source);
    const eno = readEno(buf);
    const puz = enoToPuz(eno);
    const puzbytes = writePuz(puz);
    fs.writeFileSync('test.eno', eno);
    fs.writeFileSync('test.puz', puzbytes);
});
