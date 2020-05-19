const express = require('express')
const http = require('http')
const https = require('https')
const secure = require('express-force-https')
const compression = require('compression')
var favicon = require('serve-favicon');

const app = express()
app.use(secure)
app.use(favicon(__dirname + '/public/images/favicon.ico'));

const robots = require('express-robots-txt')
const fs = require('fs')
const path = require('path')
const keyFile = path.join(__dirname, 'server.key')
const certFile = path.join(__dirname, 'server.cert')
const shortid = require('shortid')

let server;

var env = process.argv[2] || 'dev';
switch (env) {
   case 'aws':
        server = https.createServer({
            key: fs.readFileSync('/etc/letsencrypt/live/anagrind.com/privkey.pem'),
            cert: fs.readFileSync('/etc/letsencrypt/live/anagrind.com/fullchain.pem')
        }, app);
        break;
    case 'heroku':
    case 'dev':
    default:
        server = http.createServer(app);
        break;
}


const io = require('socket.io')(server);
const grids = {};
const socketGrids = {};

function queryGrid(gridid) {
    let grid = grids[gridid];
    if (grid) {
        return grid;
    }
    let success = true;
    let crossword;
    try {
        crossword = fs.readFileSync(path.join(__dirname, 'crosswords', gridid + '.eno'), 'utf8');
    } catch {
        success = false;                
    }
    if (crossword && success) {
        return createGrid(crossword, gridid);
    }
    return undefined;
}


app.get("/grid/:gridid", function(req, res, next) {
    let gridid = req.params ? req.params.gridid : undefined;
    if (!queryGrid(gridid)) {
        res.sendStatus(404);
        return;
    }
    req.url = '/';
    next('route');
});

app.use(robots({UserAgent: '*', Disallow: '/'}))

if (env == 'dev') {
  const Bundler = require('parcel-bundler');
  const bundler = new Bundler('client/index.html');
  app.use(bundler.middleware());
} else {
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/../dist/index.html'));
  });
  app.use(compression());
  app.use(express.static(__dirname + '/../dist'));
}

function firstSolverId(mask) {
    let i = 1;
    let n = 0;
    while (mask & i) {
        i <<= 1;
        n++;
    }
    return n;
}

function clearSolverId(mask, solverid) {
    mask &= ~(1 << solverid);
    return mask;
}

function createGrid(crossword, gridid) {
    const grid = {
        crossword: crossword,
        solvers: {},
        eventLog: [],
        solverMask: 0
    };
    grids[gridid] = grid;
    return grid;
}

function joinGrid(socketid, name, gridid) {
    const grid = grids[gridid];
    // find an empty slot in the solver id table
    const solverid = firstSolverId(grid.solverMask);
    grid.solverMask |= (1 << solverid);
    grid.solvers[socketid] = {
        name: name,
        solverid: solverid
    };
    socketGrids[socketid] = gridid;
    return grid;
}

io.on('connection', function(socket) {
    socket.on('shareCrossword', function(args) {
        const gridid = shortid.generate();
        const grid = createGrid(args.crossword, gridid);
        joinGrid(socket.id, args.name, gridid);
        socket.join(gridid, function() {
            socket.emit('crosswordShared', {gridid: gridid, solvers: grid.solvers, solverid: 0});
        });
    });
    socket.on('joinGrid', function(args) {
        let grid = queryGrid(args.gridid);
        if (!grid) {
            socket.emit('noSuchGrid', args.gridid);
            return;
        }
        socket.join(args.gridid, function() {
            // console.log('join ' + args.name + ' to grid: ' + args.gridid);
            const grid = joinGrid(socket.id, args.name, args.gridid);
            // hack: just replay all the packets to everyone who joins
            socket.emit('gridJoined', {
                gridid: args.gridid,
                solverid: grid.solvers[socket.id].solverid,
                solvers: grid.solvers,
                crossword: grid.crossword,
                events: grid.eventLog
            });
            event = {action: 'solversChanged', solvers: JSON.parse(JSON.stringify(grid.solvers))};
            socket.to(args.gridid).emit(event.action, event);
            grid.eventLog.push(event);
        });
    });
    socket.on('disconnect', (reason) => {
        const gridid = socketGrids[socket.id];
        const grid = grids[gridid];
        if (grid && grid.solvers) {
            const solverid = grid.solvers[socket.id].solverid;
            grid.solverMask = clearSolverId(grid.solverMask, solverid);
            delete grid.solvers[socket.id];
            if (Object.keys(grid.solvers).length == 0) {
                // console.log("delete grid: " + gridid);
                delete grids[gridid];
            } else {
                event = {action: 'solversChanged', solvers: JSON.parse(JSON.stringify(grid.solvers))};
                socket.to(gridid).emit(event.action, event);
                grid.eventLog.push(event);
            }
        }
        delete socketGrids[socket.id];
    });

    function makeBroadcastEventHandler(socket, name) {
        socket.on(name, function(event) {
            // console.log(name + ' event: ' + JSON.stringify(event));
            const rooms = Object.keys(socket.rooms);
            if (rooms.length <= 1) {
                return;
            }
            const gridid = rooms[1];
            // console.log('grid ' + gridid);
            grids[gridid].eventLog.push(event);
            socket.to(gridid).emit(name, event);
        });
    }
    ['fillCell', 'selectionChanged'].forEach(name => makeBroadcastEventHandler(socket, name));
});

module.exports = server
