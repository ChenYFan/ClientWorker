import { } from './handle/main.js'
import pkgjson from '../package.json'
import cons from './utils/cons.js'
import CacheDB from '@chenyfan/cache-db'

cons.s(`ClientWorker${pkgjson.version} Started!`)
const db = new CacheDB()
db.read('hotpatch').then(script => {
    if (!!script) {
        cons.s('Hotpatch Loaded!')
        eval(script)
    } else {
        cons.w('Hotpatch Not Found!')
    }
})
addEventListener('fetch', event => {
    event.respondWith(self.clientworkerhandle(event.request))
})
addEventListener('install', function () {
    cons.s(`ClientWorker@${pkgjson.version} Installed!`)
    self.skipWaiting();
});
addEventListener('activate', function () {
    cons.s(`ClientWorker@${pkgjson.version} Activated!`)
    self.clients.claim();
})


