const readpuz = require('@confuzzle/readpuz').readpuz;
const writepuz = require('@confuzzle/writepuz').writepuz;
const puz_common = require('@confuzzle/puz-common');

const PUZ_BLACK_SQUARE_CHAR = '.';

class PuzCrossword {
    static from(x) {
        return new PuzCrossword(readpuz(x));
    }

    isBlackSquare(grid, row, col) {
        return grid[row*this.width + col] === PUZ_BLACK_SQUARE_CHAR;
    }

    acrossSoln(grid, row, col) {
        var pos = row * this.width + col;
        var soln = '';
        while (pos < (row + 1) * this.width) {
            if (grid[pos] == PUZ_BLACK_SQUARE_CHAR)
                break;
            soln += grid[pos];
            pos++;
        }
        return soln;
    }

    downSoln(grid, row, col) {
        var pos = row * this.width + col;
        var soln = '';
        while (pos < this.height * this.width) {
            if (grid[pos] === PUZ_BLACK_SQUARE_CHAR)
                break;
            soln += grid[pos];
            pos += this.width;
        }
        return soln;
    }

    parseClues() {
        var row, col;
        var number = 1;
        var clueIndex = 0;
        this.parsedClues = [];
        const grid = this.solution;
        for (row = 0; row < this.height; row++) {
            for (col = 0; col < this.width; col++) {
                if (this.isBlackSquare(grid, row, col))
                    continue;
                var numbered = false;
                var isAcrossSpace, isDownSpace;
                var isAcrossClue = false;
                var isDownClue = false;
                var aSoln, dSoln;
                isAcrossSpace = col == 0 || this.isBlackSquare(grid, row, col - 1);
                aSoln = this.acrossSoln(grid, row, col);
                if (isAcrossSpace && aSoln.length > 1) {
                    numbered = true;
                    isAcrossClue = true;
                }
                isDownSpace = row == 0 || this.isBlackSquare(grid, row - 1, col);
                dSoln = this.downSoln(grid, row, col);
                if (isDownSpace && dSoln.length > 1) {
                    numbered = true;
                    isDownClue = true;
                }
                if (!numbered)
                    continue;

                // clues are arranged numerically, with across clues coming first
                if (isAcrossClue) {
                    const aState = this.acrossSoln(puz_common.puzState(this), row, col);
                    const aText = this.clues[clueIndex];
                    this.parsedClues.push({
                        number: number,
                        text: aText,
                        solution: aSoln,
                        state: aState,
                        row: row,
                        col: col,
                        isAcross: true,
                        length: aSoln.length
                    });
                    clueIndex++;
                }
                if (isDownClue) {
                    const dState = this.downSoln(puz_common.puzState(this), row, col);
                    const dText = this.clues[clueIndex];
                    this.parsedClues.push({
                        number: number,
                        text: dText,
                        solution: dSoln,
                        state: dState,
                        row: row,
                        col: col,
                        isAcross: false,
                        length: dSoln.length
                    });
                    clueIndex++;
                }
                number++;
            }
        }
        return this.parsedClues;
    }

    toBytes() {
        return writepuz(this);
    }

    toBuffer() {
        return Buffer.from(this.toBytes());
    }
   
    constructor(puz) {
        for (let [field, value] of Object.entries(puz))
            this[field] = value;
        this.parseClues();
    }
}

module.exports = {
    PuzCrossword: PuzCrossword
};
