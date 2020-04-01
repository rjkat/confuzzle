const express = require('express')
const https = require('https')
const app = express()

const Bundler = require('parcel-bundler')
const bundler = new Bundler('client/index.html')

const fs = require('fs')
const path = require('path')
const keyFile = path.join(__dirname, 'server.key')
const certFile = path.join(__dirname, 'server.cert')

const server = https.createServer({
    key: fs.readFileSync(keyFile),
    cert: fs.readFileSync(certFile)
}, app);

app.use(bundler.middleware())

app.get("/grid/:name", function(res, req) {
    req.url = '/';
    next('route');
});

var io = require('socket.io')(server);

io.on("connection", function(socket) {
    socket.on("joinGrid", function(grid) {
        socket.join(grid, function() {
            console.log("join grid: " + grid);
        });
        socket.emit("welcome", "gday");
    });
    socket.on("fillCell", function(event) {
        console.log("fillCell event: " + JSON.stringify(event));
        const grid = Object.keys(socket.rooms);
        console.log("grid " + grid);
        socket.to(grid[1]).emit("fillCell", event);
    });
});

module.exports = server