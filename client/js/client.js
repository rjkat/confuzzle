import io from 'socket.io-client';

export class AnagrindClient {
    constructor(app, hostname) {
        const self = this;
        const socket = io(hostname);
        this.app = app;
        socket.on('noSuchGrid', gridid => {
            console.log('no such grid: ' + gridid);
        });

        socket.on('crosswordShared', msg => self.onShareSuccess(msg));
        socket.on('fillCell', msg => self.fillCell(msg));
        socket.on('selectionChanged', msg => self.selectionChanged(msg));
        socket.on('gridJoined', msg => self.gridJoined(msg));
        socket.on('solversChanged', msg => self.solversChanged(msg));

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
        console.log('joined grid: ' + JSON.stringify(msg));
        this.app.solverid = msg.solverId;
        this.app.display.solverid = msg.solverid; 
        this.app.display.setCrosswordSource(msg.crossword);
        msg.events.forEach(event => {
            if (event.action == 'fillCell') {
                this.fillCell(event);
            } else if (event.action == 'selectionChanged') {
                this.selectionChanged(event);
            }
        });
        this.onJoinSuccess(msg);
    }

    solversChanged(msg) {
        console.log('solversChanged: ' + JSON.stringify(msg));
        this.app.solvers.solversChanged(msg);
    }

    selectionChanged(msg) {
        console.log('got selectionChanged' + JSON.stringify(msg));
        this.app.display.selectionChanged(msg);
    }

    fillCell(msg) {
        console.log('got fillCell' + JSON.stringify(msg));
        this.app.display.fillCell(msg.clueid, msg.offset, msg.value, true);
    }

    sendUpdate(event) {
        this.socket.emit(event.action, event);
    }
}
