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
        console.log("join grid: " + grid);
        socket.emit("welcome", "gday");
    });
    socket.on("clientUpdate", function(event) {
        console.log("clientUpdate event: " + JSON.stringify(event));
    });
});

module.exports = server