

export class AnagrindClient {
    constructor(app, hostname) {
        const self = this;
        
        this.app = app;
        socket.on('noSuchGrid', gridid => {
            console.log('no such grid: ' + gridid);
        });

        
        this.socket = socket;
    }

    joinGrid(gridid, name, onJoinSuccess) {
        this.onJoinSuccess = onJoinSuccess;
        this.socket.emit('joinGrid', {gridid: gridid, name: name});
    }

    shareCrossword(crossword, name, onShareSuccess) {
        this.onShareSuccess = onShareSuccess;
        
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
        console.log('solversChanged: ' + JSON.stringify(msg));
        this.app.solversChanged(msg.solvers);
    }

    selectionChanged(msg) {
        console.log('got selectionChanged' + JSON.stringify(msg));
        this.app.selectionChanged(msg);
    }

    fillCell(msg) {
        this.app.fillCell(msg.clueid, msg.offset, msg.value);
    }

    sendUpdate(event) {
        this.socket.emit(event.action, event);
    }
}
