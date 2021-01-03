class Stream {

    static EOF = -1;

    constructor() {
        /* ABSTRACT */
    }

    // you must define one of read / readByte for a readable stream
    readByte() {
        var buf = [ 0 ];
        var len = this.read(buf, 0, 1);
        if (len===0) { this._eof = true; return EOF; }
        return buf[0];
    }

    read(buf, bufOffset, length) {
        var ch, bytesRead = 0;
        while (bytesRead < length) {
            ch = this.readByte();
            if (ch === EOF) { this._eof = true; break; }
            buf[bufOffset+(bytesRead++)] = ch;
        }
        return bytesRead;
    }

    // reasonable default implementation of 'eof'
    eof() { return !!this._eof; }

    // not all readable streams are seekable
    seek(pos) {
        throw new Error('Stream is not seekable.');
    }

    tell() {
        throw new Error('Stream is not seekable.');
    }

    // you must define one of write / writeByte for a writable stream
    writeByte(_byte) {
        var buf = [ _byte ];
        this.write(buf, 0, 1);
    }

    write(buf, bufOffset, length) {
        var i;
        for (i=0; i<length; i++) {
            this.writeByte(buf[bufOffset + i]);
        }
        return length;
    }

    // flush will happily do nothing if you don't override it.
    flush() { };
}

module.exports = {
    Stream: Stream
}