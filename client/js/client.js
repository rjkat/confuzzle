import io from 'socket.io-client';

export class AnagrindClient {
    constructor(hostname, grid) {
        this.grid = grid;
        const self = this;
        const socket = io(hostname);
        
        socket.on('crosswordShared', gridId => {
            console.log('got crosswordShared: ' + gridId);
        });
        
        socket.on('fillCell', self.fillCell);

        socket.on('noSuchGrid', gridId => {
            console.log('no such grid: ' + gridId);
        });

        socket.on('gridJoined', self.gridJoined);

        socket.emit('joinGrid', grid);

        this.socket = socket;
    }

    gridJoined(msg) {
        console.log('joined grid: ' + msg.gridId);
        msg.eventLog.forEach(this.fillCell);
    }

    fillCell(event) {
        console.log('got fillCell' + JSON.stringify(event));
        this.display.fillCell(event.clueid, event.offset, event.value, true);
    }

    sendUpdate(event) {
        this.socket.emit(event.action, event);
    }
}
