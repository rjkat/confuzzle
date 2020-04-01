const express = require('express')
const https = require('https')
const app = express()

const Bundler = require('parcel-bundler')
const bundler = new Bundler('client/index.html')

const fs = require('fs')
const path = require('path')
const keyFile = path.join(__dirname, 'server.key')
const certFile = path.join(__dirname, 'server.cert')
const shortid = require('shortid')

// const server = https.createServer({
//     key: fs.readFileSync(keyFile),
//     cert: fs.readFileSync(certFile)
// }, app);

const http = require('http')
const server = http.createServer(app);

app.use(bundler.middleware())

app.get("/grid/:name", function(res, req) {
    req.url = '/';
    next('route');
});

const io = require('socket.io')(server);
const grids = {};

io.on('connection', function(socket) {
    socket.on('shareCrossword', function(args) {
        const gridId = shortid.generate();
        const solvers = [];
        solvers.push({socketId: socket.id, id: 0, name: args.name});
        grids[gridId] = {
            crossword: args.crossword,
            solvers: solvers,
            eventLog: []
        };
        socket.join(gridId, function() {
            socket.emit('crosswordShared', gridId);
        });
    });
    socket.on('joinGrid', function(args) {
        const grid = grids[args.gridId];
        if (!grid) {
            socket.emit('noSuchGrid', args.gridId);
            return;
        }
        socket.join(args.gridId, function() {
            console.log('join ' + args.name + 'to grid: ' + args.gridId);
            const solverId = grid.solvers.length;
            // hack: just replay all the packets to everyone who joins
            socket.emit('gridJoined', {
                gridId: args.gridId,
                solverId: solverId,
                solvers: grid.solvers,
                crossword: grid.crossword,
                events: grid.eventLog
            });
            grid.solvers.push({
                id: solverId,
                socketId: socket.id,
                name: args.name
            });
        });
    });
    socket.on('fillCell', function(event) {
        console.log('fillCell event: ' + JSON.stringify(event));
        const rooms = Object.keys(socket.rooms);
        if (rooms.length <= 1) {
            return;
        }
        const gridId = rooms[1];
        console.log('grid ' + gridId);
        grids[gridId].eventLog.push(event);
        socket.to(grid).emit('fillCell', event);
    });
});

module.exports = server