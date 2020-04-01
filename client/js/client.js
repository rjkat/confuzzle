import io from 'socket.io-client';

export class AnagrindClient {
    constructor(hostname) {
        const self = this;
        const socket = io(hostname);
        
        socket.on('crosswordShared', gridId => self.onShareSuccess(gridId));
        
        socket.on('fillCell', msg => self.fillCell(msg));

        socket.on('noSuchGrid', gridId => {
            console.log('no such grid: ' + gridId);
        });

        socket.on('gridJoined', msg => self.gridJoined(msg));

        this.socket = socket;
    }

    joinGrid(gridId, name, onJoinSuccess) {
        this.onJoinSuccess = onJoinSuccess;
        this.socket.emit('joinGrid', {gridId: gridId, name: name});
    }

    shareCrossword(crossword, name, onShareSuccess) {
        this.onShareSuccess = onShareSuccess;
        this.socket.emit('shareCrossword', {crossword: crossword, name: name});
    }

    gridJoined(msg) {
        console.log('joined grid: ' + msg.gridId);
        this.display.setCrosswordSource(msg.crossword);
        msg.events.forEach(event => this.fillCell(event));
        this.onJoinSuccess(msg);
    }

    fillCell(event) {
        console.log('got fillCell' + JSON.stringify(event));
        this.display.fillCell(event.clueid, event.offset, event.value, true);
    }

    sendUpdate(event) {
        this.socket.emit(event.action, event);
    }
}
