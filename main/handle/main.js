import router_cgi from './cgi.js'
import CacheDB from '@chenyfan/cache-db'
import cons from './../utils/cons.js'
import FetchEngine from '../utils/engine.js'
const mainhandle = async (request) => {
    const db = new CacheDB()

    let tReq = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        mode: request.mode === 'navigate' ? 'same-origin' : request.mode,
        credentials: request.credentials,
        redirect: request.redirect,
        cache: request.cache
    })
    const urlStr = tReq.url.toString()
    const urlObj = new URL(urlStr)
    const pathname = urlObj.pathname
    if (pathname.split('/')[1] === 'cw-cgi') {
        return router_cgi(request)
    }
    const config = await db.read('config', { type: "json" })
    if (!config) return fetch(request)





    let tFetched = false
    let EngineFetch = false
    let tRes = new Response()
    for (var catch_rule of config.catch_rules) {
        if (!tReq.url.match(new RegExp(catch_rule.rule))) continue;
        let EngineFetchList = []
        for (var transform_rule of catch_rule.transform_rules) {
            let tSearched = false

            if (transform_rule.search === '_') transform_rule.search = catch_rule.rule
            switch (transform_rule.type || "url") {
                case 'url':
                    if (tReq.url.match(new RegExp(transform_rule.search))) tSearched = true;
                    if (tFetched && tSearched) { cons.w(`${tReq.url} is already fetched,the url transform rule:${transform_rule.search} are ignored`); break }
                    if (typeof transform_rule.replace !== 'undefined' && tSearched) {
                        if (typeof transform_rule.replace === 'string') {
                            if (EngineFetch) cons.w(`EngineFetch Disabled for ${tReq.url},the request will downgrade to normal fetch`)
                            tReq = new Request(tReq.url.replace(new RegExp(transform_rule.search), transform_rule.replace), tReq)
                            EngineFetch = false
                        } else {
                            if (EngineFetch) { cons.w(`Replacement cannot be used for ${tReq.url},the request is already powered by fetch-engine `); break }
                            transform_rule.replace.forEach(replacement => {
                                EngineFetchList.push(
                                    new Request(tReq.url.replace(new RegExp(transform_rule.search), replacement), tReq)
                                )
                            });
                            EngineFetch = true
                        }
                    }
                    break
                case 'status':
                    if (!tFetched) { cons.w(`${tReq.url} is not fetched yet,the status rule are ignored`); break }
                    if (String(tRes.status).match(new RegExp(transform_rule.search))) tSearched = true;
                    if (typeof transform_rule.replace === 'string' && tSearched) tRes = new Response(tRes, { status: tRes.status.replace(new RegExp(transform_rule.search), transform_rule.replace), statusText: tRes.statusText, headers: tRes.headers })
                    break
                case 'statusText':
                    if (!tFetched) { cons.w(`${tReq.url} is not fetched yet,the statusText rule are ignored`); break }
                    if (tRes.statusText.match(new RegExp(transform_rule.search))) tSearched = true;
                    if (typeof transform_rule.replace === 'string' && tSearched) tRes = new Response(tRes, { status: tRes.status, statusText: tRes.statusText.replace(new RegExp(transform_rule.search), transform_rule.replace), headers: tRes.headers })
                    break
                default:
                    cons.e(`${tReq.url} the ${transform_rule.type} rule are not supported`);
                    break
            }
            if (!tSearched) continue
            if (typeof transform_rule.header === 'object') {
                for (var header in transform_rule.header) {
                    if (tFetched) {
                        tRes = new Response(tRes.body, { ...tRes, headers: { ...tRes.headers, [header]: transform_rule.header[header] } })
                    } else {
                        tReq = new Request(tReq.body, { ...tReq, headers: { ...tReq.headers, [header]: transform_rule.header[header] } })
                    }
                }
            }

            if (typeof transform_rule.action !== 'undefined') {
                switch (transform_rule.action) {
                    case 'fetch':
                        if (tFetched) { cons.w(`${tReq.url} is already fetched,the fetch action are ignored`); break }
                        if (typeof transform_rule.fetch === 'undefined') { cons.e(`Fetch Config is not defined for ${tReq.url}`); break }

                        let fetchConfig = {
                            status: transform_rule.fetch.status,
                            mode: transform_rule.fetch.mode,
                            credentials: transform_rule.fetch.credentials,
                            redirect: transform_rule.fetch.redirect,
                            cache: transform_rule.fetch.cache,
                            timeout: transform_rule.fetch.timeout
                        }
                        if (!transform_rule.fetch.prelight) {
                            tReq = new Request(tReq.url) //https://segmentfault.com/a/1190000006095018
                            delete fetchConfig.credentials
                            fetchConfig.mode = "cors"
                            for (var eReq in EngineFetchList) {
                                EngineFetchList[eReq] = new Request(EngineFetchList[eReq].url)
                            }
                        }
                        if (!EngineFetch) {
                            tRes = await FetchEngine.fetch(tReq, fetchConfig)
                        } else {
                            switch (transform_rule.fetch.engine) {
                                case 'classic':
                                    tRes = await FetchEngine.classic(EngineFetchList, fetchConfig)
                                    break;
                                case 'parallel':
                                    tRes = await FetchEngine.parallel(EngineFetchList, fetchConfig)
                                    break;
                                default:
                                    cons.e(`Fetch Engine ${transform_rule.fetch.engine} is not supported`)
                                    break;
                            }
                        }
                        tFetched = true
                        break
                    case 'redirect':
                        if (typeof transform_rule.redirect === 'undefined') continue
                        if (typeof transform_rule.redirect.url === 'string') return Response.redirect(transform_rule.redirect.url, transform_rule.redirect.status || 301)
                        return Response.redirect(
                            tReq.url.replace(new RegExp(transform_rule.search), transform_rule.redirect.to),
                            transform_rule.redirect.status || 301
                        )
                    case 'return':
                        if (typeof transform_rule.return === 'undefined') transform_rule.return = {}
                        return new Response(transform_rule.return.body || "Error!", {
                            status: transform_rule.return.status || 503,
                            headers: transform_rule.return.headers || {}
                        })
                    default:
                        cons.w(`This Action:${transform_rule.action} is not supported yet`)
                        break
                }
            }
        }


    }
    if (!tFetched) {
        if (EngineFetch) {
            tRes = await FetchEngine.classic(EngineFetchList, { status: 200 })
        } else {
            tRes = await fetch(tReq)
        }
    }
    return tRes
}

export default mainhandle