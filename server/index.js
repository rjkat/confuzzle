const server = require('./server')

let port;
var env = process.argv[2] || 'dev';
switch (env) {
    case 'dev':
        port = 5775;
        break;
    case 'heroku':
        port = process.env.PORT;
        break;
    case 'aws':
        port = 3000;
        break;
}

if (env == 'aws') {
  const redirPort = 8080;
  const express = require('express')
  const app = express()
  const http = require('http')
  const redirectServer = http.createServer(app);
  app.get("*", function(req, res) {
      res.redirect('https://anagrind.com' + req.url);
  });
  redirectServer.listen(redirPort);
}

server.listen(port, () => console.log('listening on port: ' + port));
