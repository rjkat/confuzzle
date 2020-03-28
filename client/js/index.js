import {AnagrindClient} from './anagrind-client.js'

var client = new AnagrindClient(window.location.host, window.location.pathname);

document.getElementById('send-update-button').onclick = function() {
    client.sendUpdate({action: 'test'});
}