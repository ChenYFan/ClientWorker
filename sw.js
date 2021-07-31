const CACHE_NAME = 'ClientWorkerCache';
let cachelist = [];

const interceptdomain = [
    "127.0.0.1:9909",
    "blog-jsdelivr.cyfan.top"
]


const proxylist = [
    "cdn.jsdelivr.net/gh/chenyfan/blog@gh-pages",
    "cdn.jsdelivr.net/npm/chenyfan-blog@latest",
    "unpkg.zhimg.com/chenyfan-blog@latest"

]

const website = true
const handle_error = true

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
    try {
        event.respondWith(handle(event.request))
    } catch (msg) {
        event.respondWith(handleerr(event.request, msg))
    }
});

const handleerr = async (req, msg) => {
    return new Response(`<h1>ClientWorker用户端错误</h2>
    <b>${msg}</b>`, { headers: { "content-type": "text/html; charset=utf-8" } })
}
const handle = async (req) => {
    const urlStr = req.url
    const urlObj = new URL(urlStr)
    const pathname = urlObj.href.substr(urlObj.origin.length)
    const domain = (urlStr.split('/'))[2]
    let path = pathname.split("#")[0].split("?")[0]
    if (interceptdomain.indexOf(domain) !== -1) {
        if (path.startsWith('/cw-cgi/')) {
            switch (path.replace('/cw-cgi/', '')) {
                case 'test':
                    return new Response('OK')
                case 'ws':
                    return new Response('WebSocket Will Be Never Supported.')
                default:
                    return new Response(`<h1>ClientWorker用户端信息</h2>
                    <h2>拦截域名</h2>
                    ${(() => { let p = ''; for (var i in interceptdomain) { p += "<li>"; p += interceptdomain[i]; p += "</li>" } return p })()}
                    <h2>负载地址</h2>
                    ${(() => { let p = ''; for (var i in proxylist) { p += "<li>"; p += proxylist[i]; p += "</li>" } return p })()}
                    <h2>自定义处理:</h2>
                    <h3>站点模式:</h3>
                    <b>${website ? "已开启" : "已关闭"}</b><br>
                    <h3>错误代码劫持:</h3>
                    <b>${website ? "已开启" : "已关闭"}</b>`
                        , { headers: { "content-type": "text/html; charset=utf-8" } })

            }
        }
        return custom(req)
    } else {
        return fetch(req)
    }

}


const custom = async (req) => {
    const urlStr = req.url
    const urlObj = new URL(urlStr)
    const pathname = urlObj.href.substr(urlObj.origin.length)
    const domain = (urlStr.split('/'))[2]
    let path = pathname.split("#")[0].split("?")[0]

    if (website && path.endsWith('/')) { path += "index.html" }
    let n = ""
    for (var i in proxylist) {
        try {
            n = await fetch(`https://${proxylist[i]}${path}${urlObj.search}`, {
                method: req.method,
                body: req.body
            });
            break;
        } catch (p) {
            continue;
        }

    }
    if (n === "") {
        return new Response(`<h1>ClientWorker服务端错误</h2>
        <b>所有的负载均失效，请联系网站管理员恢复</b>`, { headers: { "content-type": "text/html; charset=utf-8" } })
    }
    if (n.status >= 400 && handle_error) {
        return new Response(`<h1>ClientWorker服务端错误</h2>
        <b>错误代码：${n.status}</b>`, { headers: { "content-type": "text/html; charset=utf-8" } })
    }
    if (website && path.endsWith('.html') && n.headers.get('content-type').match('text/plain')) {
        return new Response(await n.text(), { headers: { "content-type": "text/html; charset=utf-8" } })
    } else {
        return n
    }
}
