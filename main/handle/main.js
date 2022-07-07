import router_cgi from './cgi.js'
import CacheDB from '@chenyfan/cache-db'
import cons from './../utils/cons.js'
import FetchEngine from '../utils/engine.js'
const mainhandle = async (request) => {
    const db = new CacheDB()

    let tReq = request
    const urlStr = tReq.url.toString()
    const urlObj = new URL(urlStr)
    const pathname = urlObj.pathname
    if (pathname.split('/')[1] === 'cw-cgi') {
        return router_cgi(request)
    }
    const config = await db.read('config', { type: "json" })





    let tFetched = false
    let EngineFetch = false
    let tRes = new Response()
    for (var catch_rule of config.catch_rules) {
        if (!tReq.url.match(new RegExp(catch_rule.rule))) continue;
        let EngineFetchList = []
        for (var transform_rule of catch_rule.transform_rules) {
            let tSerached = false

            if (transform_rule.search === '_') transform_rule.search = catch_rule.rule
            switch (transform_rule.type || "url") {
                case 'url':
                    if (tReq.url.match(new RegExp(transform_rule.search))) tSerached = true;
                    if (tFetched && tSerached) { cons.w(`${tReq.url} is already fetched,the url transform rule:${transform_rule.search} are ignored`); break }
                    if (typeof transform_rule.replace !== 'undefined' && tSerached) {
                        if (typeof transform_rule.replace === 'string') {
                            if (EngineFetch) cons.w(`EngineFetch Disabled for ${tReq.url},the request will downgrade to normal fetch`)
                            tReq = new Request(tReq.url.replace(new RegExp(transform_rule.search), transform_rule.replace))
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
                    if (String(tRes.status).match(new RegExp(transform_rule.search))) tSerached = true;
                    if (typeof transform_rule.replace === 'string' && tSerached) tRes = new Response(tRes, { status: tRes.status.replace(new RegExp(transform_rule.search), transform_rule.replace), statusText: tRes.statusText, headers: tRes.headers })
                    break
                case 'statusText':
                    if (!tFetched) { cons.w(`${tReq.url} is not fetched yet,the statusText rule are ignored`); break }
                    if (tRes.statusText.match(new RegExp(transform_rule.search))) tSerached = true;
                    if (typeof transform_rule.replace === 'string' && tSerached) tRes = new Response(tRes, { status: tRes.status, statusText: tRes.statusText.replace(new RegExp(transform_rule.search), transform_rule.replace), headers: tRes.headers })
                    break
                default:
                    cons.e(`${tReq.url} the ${transform_rule.type} rule are not supported`);
                    break
            }
            if (!tSerached) continue
            if (typeof transform_rule.header === 'object') {
                for (var header in transform_rule.header) {
                    if (tFetched) {
                        tRes.headers.set(header, transform_rule.header[header])
                    } else {
                        tReq = new Request(tReq, { headers: { ...tReq, [header]: transform_rule.header[header] } })
                    }
                }
            }
            if (typeof transform_rule.redirect === 'string') {
                return Response.redirect(tRes.url.replace(new RegExp(transform_rule.search), transform_rule.redirect), 301)
            }
            if (typeof transform_rule.return === 'string') {
                return new Response(transform_rule.return, {
                    status: 200, headers: {
                        'Content-Type': 'text/html;charset=utf-8'
                    }
                })
            }
            if (typeof transform_rule.action !== 'undefined') {
                switch (transform_rule.action) {
                    case 'fetch':
                        if(tFetched) {cons.w(`${tReq.url} is already fetched,the fetch action are ignored`);break}
                        if (typeof transform_rule.fetch === 'undefined') { cons.e(`Fetch Config is not defined for ${tReq.url}`); break }
                        const fetchConfig = {
                            status: transform_rule.fetch.status,
                            mode: transform_rule.fetch.mode,
                            credentials: transform_rule.fetch.credentials,
                            redirect: transform_rule.fetch.redirect,
                            cache: transform_rule.fetch.cache
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
                                    cons.d(JSON.stringify(transform_rule.fetch))
                                    cons.e(`Fetch Engine ${transform_rule.fetch.engine} is not supported`)
                                    break;
                            }
                        }
                        tFetched = true
                        break
                    default:
                        cons.w(`This Action:${transform_rule.action} is not supported yet`)
                        break
                }
            }
        }


    }
    if (!tFetched) {
        if (EngineFetch) {
            tRes = await FetchEngine.classic(EngineFetchList)
        } else {
            tRes = await fetch(tReq)
        }
    }
    return tRes


    /*switch (catch_rule.type) {
        case 'url':
            if (tReq.url.match(catch_rule.rule)) {
                for (var transform_rule in config.catch_rules[catch_rule].transform_rules) {
                    if (transform_rule.search === '_') transform_rule.search = catch_rule.rule
                    switch (transform_rule.searchin || catch_rule.type) {
                        case 'url':

                            if (tReq.url.match(transform_rule.search)) {
                                if (typeof transform_rule.replace === 'string') {
                                    tReq = new Request(tReq.url.replace(transform_rule.search, transform_rule.replace), tReq)
                                }
                            }
                    }
                }
            }
        default:
            cons.w(`This type of rule:${rule.type} is not supported yet.`)
            continue;
    }*/
}

export default mainhandle