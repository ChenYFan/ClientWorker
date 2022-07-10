import mainhandle from './handle/main.js'
addEventListener('fetch', event => {
    event.respondWith(mainhandle(event.request))
})
addEventListener('install', function() {
    self.skipWaiting();
});