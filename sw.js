const CACHE_NAME = 'ClientWorkerCache';
let cachelist = [];

const selfdomain = [
    "127.0.0.1:44412",
    "blog-jsdelivr.cyfan.top"
]

self.addEventListener('install', function (installEvent) {
    installEvent.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log('Opened cache');
                return cache.addAll(cachelist);
            })
    );
});


self.addEventListener('fetch', event => {

    event.respondWith(handle(event.request))

});


const handle = async (req) => {
    const urlStr = req.url
    const urlObj = new URL(urlStr)
    const pathname = urlObj.href.substr(urlObj.origin.length)
    const domain = (urlStr.split('/'))[2]
    let path = pathname.split("#")[0].split("?")[0]

    if (selfdomain.indexOf(domain) !== -1) {
        if (path === "/cw/api/test") { return new Response('OK') }
        if (path === "/cw/api/ws") { return new Response('目前暂时不支持') }
        return custom(req)
    } else { return fetch(req) }

}


const custom = async (req) => {
    const urlStr = req.url
    const urlObj = new URL(urlStr)
    const pathname = urlObj.href.substr(urlObj.origin.length)
    const domain = (urlStr.split('/'))[2]
    let path = pathname.split("#")[0].split("?")[0]
    if (path.endsWith('/')) { path += "index.html" }
//简单的路由判断
    if (path.endsWith('.html')) {
        const req = await (await fetch(`https://cdn.jsdelivr.net/gh/chenyfan/blog@gh-pages${path}`)).text()
        return new Response(req, { headers: { "content-type": "text/html; charset=utf-8" } })
    } else {
        return fetch(`https://cdn.jsdelivr.net/gh/chenyfan/blog@gh-pages${path}`)
    }
}
