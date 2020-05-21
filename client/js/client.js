import io from 'socket.io-client';

export class AnagrindClient {
    constructor(app, hostname) {
        const self = this;
        const socket = io(hostname);
        this.app = app;
        socket.on('noSuchGrid', gridid => {
            console.log('no such grid: ' + gridid);
        });

        this.handlers = {
            crosswordShared: 'onShareSuccess',
            fillCell: 'fillCell',
            selectionChanged: 'selectionChanged',
            gridJoined: 'gridJoined',
            solversChanged: 'solversChanged'
        };
        for (let [action, callback] of Object.entries(this.handlers)) {
            socket.on(action, msg => self[callback](msg));
        }
        this.socket = socket;
    }

    joinGrid(gridid, name, onJoinSuccess) {
        this.onJoinSuccess = onJoinSuccess;
        this.socket.emit('joinGrid', {gridid: gridid, name: name});
    }

    shareCrossword(crossword, name, onShareSuccess) {
        this.onShareSuccess = onShareSuccess;
        this.socket.emit('shareCrossword', {crossword: crossword, name: name});
    }

    gridJoined(msg) {
        this.app.solverid = msg.solverId;
        this.app.display.solverid = msg.solverid; 
        this.app.setCrosswordSource(msg.crossword);
        const self = this;
        msg.events.forEach(event => self[self.handlers[event.action]](event));
        this.onJoinSuccess(msg);
    }

    solversChanged(msg) {
        // console.log('solversChanged: ' + JSON.stringify(msg));
        this.app.solvers.solversChanged(msg.solvers);
    }

    selectionChanged(msg) {
        // console.log('got selectionChanged' + JSON.stringify(msg));
        this.app.display.selectionChanged(msg);
    }

    fillCell(msg) {
        // console.log('got fillCell' + JSON.stringify(msg));
        this.app.display.fillCell(msg.clueid, msg.offset, msg.value, true);
    }

    sendUpdate(event) {
        this.socket.emit(event.action, event);
    }
}
