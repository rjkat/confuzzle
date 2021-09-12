import * as server from './server.mjs'

let port;
var env = process.argv[2] || 'dev';
switch (env) {
    case 'heroku':
        port = process.env.PORT;
        break;
    case 'aws':
        port = 3000;
        break;
    case 'dev':
    default:
        port = 5775;
        break;
}

server.listen(port, () => console.log('listening on port: ' + port));
