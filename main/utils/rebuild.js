const rebuild = {
    request: (req, init) => {
        let nReq =  new Request(init.body || req.body, {
            headers: rebuildheaders(req, init.headers),
            method: init.method || req.method,
            mode: init.mode || req.mode,
            credentials: init.credentials || req.credentials,
            redirect: init.redirect || req.redirect
        })
        if(!!init.url)nReq = new Request(init.url, nReq)
        return nReq
    },
    response: (res, init) => {
       let nRes = new Response(init.body || res.body, {
            headers: rebuildheaders(res, init.headers),
            status: init.status || res.status,
            statusText: init.statusText || res.statusText
        })
        if(!!init.url && init.url !== " ")nRes = new Response(init.url, nRes)
        return nRes
    }
}

const rebuildheaders = (re, headers) => {
    if (!!headers) {
        const nHeaders = new Headers(re.headers)
        for (let key in headers) {
            if (headers[key] !== undefined) {
                nHeaders.set(key, headers[key])
            } else {
                nHeaders.delete(key)
            }
        }
        return nHeaders
    }
    return new Headers(re.headers)
}
export default rebuild