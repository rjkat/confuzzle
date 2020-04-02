const server = require('./server')
const express = require('express')

const app = express()
const http = require('http')
const redirectServer = http.createServer(app);
app.get("*", function(req, res) {
    res.redirect('https://anagrind.com' + req.url);
});

redirectServer.listen(8080);

// Start server listening
server.listen(3000, () => console.log('listening on port: 3000'))
