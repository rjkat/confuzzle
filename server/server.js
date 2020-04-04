const express = require('express')
const http = require('http')
const https = require('https')
const app = express()

const Bundler = require('parcel-bundler')
const bundler = new Bundler('client/index.html')

const fs = require('fs')
const path = require('path')
const keyFile = path.join(__dirname, 'server.key')
const certFile = path.join(__dirname, 'server.cert')
const shortid = require('shortid')

let server;

var env = process.argv[2] || 'dev';
switch (env) {
    case 'dev':
	server = http.createServer(app);
        break;
    case 'production':
	server = https.createServer({
	     key: fs.readFileSync('/etc/letsencrypt/live/anagrind.com/privkey.pem'),
	     cert: fs.readFileSync('/etc/letsencrypt/live/anagrind.com/fullchain.pem')
	}, app);
        break;
}

app.use(bundler.middleware())

app.get("/grid/:name", function(res, req) {
    req.url = '/';
    next('route');
});

const io = require('socket.io')(server);
const grids = {};
const socketGrids = {};

io.on('connection', function(socket) {
    socket.on('shareCrossword', function(args) {
        const gridid = shortid.generate();
        const solvers = {};
        solvers[socket.id] = {name: args.name, solverid: 0};
        grids[gridid] = {
            crossword: args.crossword,
            solvers: solvers,
            eventLog: []
        };
        socket.join(gridid, function() {
            socket.emit('crosswordShared', {gridid: gridid, solvers: solvers, solverid: 0});
        });
    });
    socket.on('joinGrid', function(args) {
        const grid = grids[args.gridid];
        if (!grid) {
            socket.emit('noSuchGrid', args.gridid);
            return;
        }
        socket.join(args.gridid, function() {
            console.log('join ' + args.name + ' to grid: ' + args.gridid);
            const grid = grids[args.gridid];
            const solverid = Object.keys(grid.solvers).length;
            grid.solvers[socket.id] = {
                name: args.name,
                solverid: solverid
            };
            // hack: just replay all the packets to everyone who joins
            socket.emit('gridJoined', {
                gridid: args.gridid,
                solverid: solverid,
                solvers: grid.solvers,
                crossword: grid.crossword,
                events: grid.eventLog
            });
            socketGrids[socket.id] = args.gridid;
            socket.to(args.gridid).emit('solversChanged', grid.solvers);
        });
    });
    socket.on('disconnect', (reason) => {
        const gridid = socketGrids[socket.id];
        const grid = grids[gridid];
        if (grid && grid.solvers) {
            delete grid.solvers[socket.id];
            socket.to(gridid).emit('solversChanged', grid.solvers);
        }
    });

    function makeBroadcastEventHandler(socket, name) {
        socket.on(name, function(event) {
            console.log(name + ' event: ' + JSON.stringify(event));
            const rooms = Object.keys(socket.rooms);
            if (rooms.length <= 1) {
                return;
            }
            const gridid = rooms[1];
            console.log('grid ' + gridid);
            grids[gridid].eventLog.push(event);
            socket.to(gridid).emit(name, event);
        });
    }
    ['fillCell', 'selectionChanged'].forEach(name => makeBroadcastEventHandler(socket, name));
});

module.exports = server
