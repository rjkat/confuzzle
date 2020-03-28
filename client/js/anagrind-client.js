import io from 'socket.io-client';

export class AnagrindClient {
    constructor(hostname, grid) {
        this.socket = io(hostname);
        this.socket.emit('joinGrid', grid);
        this.socket.on("welcome", (message) => {
            console.log("got welcome: " + message);
        });
    }

    sendUpdate(event) {
        this.socket.emit('clientUpdate', event);
    }
}
