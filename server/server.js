const express = require('express')
const http = require('http')
const app = express()

const Bundler = require('parcel-bundler')
const bundler = new Bundler('client/index.html')

const server = http.createServer(app);

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