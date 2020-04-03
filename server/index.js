const server = require('./server')

let port = 5775;
if (process.argv && process.argv[2] == 'production') {
  const express = require('express')
  const app = express()
  const http = require('http')
  const redirectServer = http.createServer(app);
  app.get("*", function(req, res) {
      res.redirect('https://anagrind.com' + req.url);
  });
  redirectServer.listen(8080);
  port = 3000;
}

server.listen(port, () => console.log('listening on port: ' + port));
