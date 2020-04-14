const server = require('./server')

let port = 5775;

let redirPort = 8080;
let prodPort = 3000;
const isHeroku = process.argv && process.argv[2] == 'heroku';
const isProduction = process.argv && process.argv[2] == 'production';

if (isHeroku) {
    redirPort = 80;
    prodPort = 443;
}
if (isHeroku || isProduction) {
  const express = require('express')
  const app = express()
  const http = require('http')
  const redirectServer = http.createServer(app);
  app.get("*", function(req, res) {
      res.redirect('https://anagrind.com' + req.url);
  });
  redirectServer.listen(redirPort);
  port = prodPort;
}

server.listen(port, () => console.log('listening on port: ' + port));
