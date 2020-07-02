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
        let currentSolvers = msg.solvers;
        for (let i = 0; i < msg.events.length; i++) {
            const event = msg.events[i];
            if (event.action == 'solversChanged') {
                currentSolvers = event.solvers;
            }
        }
        this.app.gridJoined(msg, currentSolvers);
        for (let i = 0; i < msg.events.length; i++) {
            const event = msg.events[i];
            if (event.action == 'fillCell') {
                this.fillCell(event);
            }
        }
    }

    solversChanged(msg) {
        // console.log('solversChanged: ' + JSON.stringify(msg));
        this.app.solvers = msg.solvers;
    }

    selectionChanged(msg) {
        // console.log('got selectionChanged' + JSON.stringify(msg));
        this.app.selectionChanged(msg);
    }

    fillCell(msg) {
        this.app.fillCell(msg.clueid, msg.offset, msg.value);
    }

    sendUpdate(event) {
        this.socket.emit(event.action, event);
    }
}
