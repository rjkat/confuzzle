import io from 'socket.io-client';

export class AnagrindClient {
    constructor(hostname, grid) {
        this.grid = grid;
        const self = this;
        const socket = io(hostname);
        socket.emit('joinGrid', grid);
        socket.on("welcome", (message) => {
            console.log("got welcome: " + message);
        });
        socket.on("fillCell", function (event) {
            console.log("got fillCell" + JSON.stringify(event));
            self.display.fillCell(event.clueid, event.offset, event.value, true);
        });
        this.socket = socket;
    }

    sendUpdate(event) {
        this.socket.emit(event.action, event);
    }
}
