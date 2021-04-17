const express = require('express')
const http = require('http')
const https = require('https')

const secure = require('express-force-https')
const compression = require('compression')
const favicon = require('serve-favicon');

const app = express()
app.use(favicon(__dirname + '/public/images/favicon.ico'));

const robots = require('express-robots-txt')
const fs = require('fs')
const path = require('path')
const keyFile = path.join(__dirname, 'server.key')
const certFile = path.join(__dirname, 'server.cert')
const {hri} = require('human-readable-ids');

const AWS = require('aws-sdk');
const nanoid = require('nanoid');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');

app.use(bodyParser.urlencoded({extended: true}));

const s3 = new AWS.S3();

let server;

var env = process.argv[2] || 'dev';
switch (env) {
    case 'heroku':
        app.use(secure);
    case 'dev':
    default:
        server = http.createServer(app);
        break;
}


const io = require('socket.io')(server, {
  pingTimeout: 60000,
});
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


app.use(robots({UserAgent: '*', Disallow: '/'}))


if (env == 'dev') {
  const Bundler = require('parcel-bundler');
  const bundler = new Bundler('client/index.html', {
       sourceMaps: false
  });
  app.use(bundler.middleware());
  // app.use(express.static(__dirname + '/../dist'));

} else {
  app.use(compression());
  app.use(function (req, res, next) {
    if (req.hostname == 'anagr.in' ||
        req.hostname == 'anagrind.com' ||
        req.hostname == 'xword.party' ||
        req.hostname == 'confuzzle.me') {
        res.redirect(301, 'https://confuzzle.app' + req.url);
        return;
    }
    next();
  });
  app.use(express.static(__dirname + '/../dist'));
}

app.post('/shorten', function (req, res) {
    if (!req.body || !req.body.uri || !req.body.format) {
        res.status(400);
        return;
    }
    const uri = req.body.uri;
    const urlObj = new URL(uri);
    if (!(urlObj.protocol == 'http:' || urlObj.protocol == 'https:')) {
        res.status(400);
        return;
    }
    const format = req.body.format;
    if (!(format == 'puz' || format == 'confuz')) {
        res.status(400);
        return;
    }
    const objID = shortenLink(uri, format);
    res.send(objID);
});

app.get('/external', function (req, res) {
    if (!req.query || !req.query.uri) {
        res.status(400);
        return;
    }
    const uri = req.query.uri;
    fetch(uri).then(
        r => r.body.pipe(res)
    );
});

app.use(function (req, res, next) {
    if (req.path == '/') {
        res.sendFile(path.join(__dirname + '/../dist/index.html'));
        return;
    }
    if (req.path == '/syntax') {
        res.sendFile(path.join(__dirname + '/../dist/syntax.html'));
        return;
    }
    res.sendFile(path.join(__dirname + '/../dist/index.html'));
});


function shortenLink(uri, sourceType) {
    const objID = nanoid.nanoid(10);
    const redirectURI = 'https://confuzzle.app?' + sourceType + '=' + encodeURIComponent(uri) + '&gid=' + objID;
    s3.putObject({
      ACL: 'public-read',
      Bucket: 'urls.confuzzle.me',
      Key: objID,
      WebsiteRedirectLocation: redirectURI
    }, function(err, data) {
      if (err) console.log(err, err.stack);
    });
    return objID;
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

function createGrid(crossword, gridid, eventLog) {
    if (!eventLog) {
        eventLog = []
    }
    const grid = {
        crossword: crossword,
        solvers: {},
        eventLog: eventLog,
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
        const gridid = hri.random();
        const grid = createGrid(args.crossword, gridid, args.eventLog);
        joinGrid(socket.id, args.name, gridid);
        socket.join(gridid);
        socket.emit('crosswordShared', {gridid: gridid, solvers: grid.solvers, solverid: 0});
    });
    socket.on('joinGrid', function(args) {
        let found = queryGrid(args.gridid);
        if (!found) {
            socket.emit('noSuchGrid', args.gridid);
            return;
        }
        socket.join(args.gridid);
        const grid = joinGrid(socket.id, args.name, args.gridid);
        const solver = grid.solvers[socket.id];
        // just replay all the packets to everyone who joins
        socket.emit('gridJoined', {
            gridid: args.gridid,
            solverid: solver.solverid,
            solvers: grid.solvers,
            crossword: grid.crossword,
            events: grid.eventLog
        });
        event = {
            action: 'solversChanged',
            solvers: JSON.parse(JSON.stringify(grid.solvers)),
            joined: solver
        };
        socket.to(args.gridid).emit(event.action, event);
        grid.eventLog.push(event);
    });
    socket.on('disconnect', (reason) => {
        const gridid = socketGrids[socket.id];
        const grid = grids[gridid];
        if (grid && grid.solvers) {
            const solverid = grid.solvers[socket.id].solverid;
            grid.solverMask = clearSolverId(grid.solverMask, solverid);
            const solver = grid.solvers[socket.id];
            delete grid.solvers[socket.id];
            if (Object.keys(grid.solvers).length == 0) {
                // console.log("delete grid: " + gridid);
                delete grids[gridid];
            } else {
                event = {
                    action: 'solversChanged',
                    solvers: JSON.parse(JSON.stringify(grid.solvers)),
                    disconnected: solver
                };
                socket.to(gridid).emit(event.action, event);
                grid.eventLog.push(event);
            }
        }
        delete socketGrids[socket.id];
    });

    function makeBroadcastEventHandler(socket, name) {
        socket.on(name, function(event) {
            let gridid = '';
            for (let room of socket.rooms) {
                if (room != socket.id) {
                    gridid = room;
                }
            } 
            if (!gridid) {
                return;
            }
            grids[gridid].eventLog.push(event);
            socket.to(gridid).emit(name, event);
        });
    }
    ['fillCell', 'selectionChanged'].forEach(name => makeBroadcastEventHandler(socket, name));
});

module.exports = server
