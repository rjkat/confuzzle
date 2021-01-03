const fs = require('fs');
const path = require('path');
const PuzPayload = require('../client/js/puz.js').PuzPayload;
const confuz = require('../client/js/confuz.js');

test('weekday', () => {
    const source = path.join(__dirname, 'puzfiles', 'nyt_weekday_with_notes.puz');
    const buf = fs.readFileSync(source);
    const eno = confuz.fromPuz(PuzPayload.from(buf));
    const puz = confuz.toPuz(eno);
    const puzbytes = puz.toBytes();
    fs.writeFileSync('test.eno', eno);
    fs.writeFileSync('test.puz', puzbytes);
});


test('compression', () => {
    const source = path.join(__dirname, 'puzfiles', 'nyt_weekday_with_notes.puz');
    const buf = fs.readFileSync(source);
    const eno = confuz.fromPuz(PuzPayload.from(buf));
    const puz = confuz.toPuz(eno);
    const puzbytes = puz.toCompressed();
    const puz2 = PuzPayload.fromCompressed(puzbytes);
    expect(puz2.author).toBe(puz.author);

    const strippedBytes = puz.toCompressed(true);
    const puz3 = PuzPayload.fromCompressed(strippedBytes, true);
    expect(puz3.author).toBe(puz.author);
});
