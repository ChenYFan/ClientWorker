import mainhandle from './handle/main.js'
import pkgjson from '../package.json'
import cons from './utils/cons.js'
addEventListener('fetch', event => {
    event.respondWith(mainhandle(event.request))
})
addEventListener('install', function() {
    cons.s(`ClientWorker@${pkgjson.version} installed!`)
    self.skipWaiting();
});
addEventListener('activate', function() {
    cons.s(`ClientWorker@${pkgjson.version} activated!`)
    self.clients.claim();
})