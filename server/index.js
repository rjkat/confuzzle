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

server.listen(port, () => console.log('listening on port: ' + port));
