import yaml from 'js-yaml'
import CacheDB from '@chenyfan/cache-db'
import cwpkgjson from './../../package.json'
const router_cgi = async (request) => {
    const db = new CacheDB()
    const urlStr = request.url.toString()
    const urlObj = new URL(urlStr)
    const pathname = urlObj.pathname
    const q = (s) => { return urlObj.searchParams.get(s) }
    switch (pathname.split('/')[2]) {
        case 'page':
            switch (q('type')) {
                case 'install':
                    return fetch('/404.html',{
                        redirect: 'follow'
                    }).catch(e=>{
                        return fetch(`https://npm.elemecdn.com/clientworker@${cwpkgjson.version}/dist/404.html`)
                    })
                default:
                    return new Response('Error, page type not found')
            }
        case 'api':

            switch (q('type')) {
                case 'config':
                    return fetch('/config.yaml')
                        .then(res => res.text())
                        .then(text => yaml.load(text))
                        .then(async config => {
                            await db.write('config', JSON.stringify(config), { type: "json" })
                            return new Response('ok')
                        })
                        .catch(async err => {
                            await db.write('config', '')
                            return new Response(err)
                        })
                default:
                    return new Response('Error, api type not found')
            }
        default:
            return new Response('Not Found!, Client Worker!')
    }
}
export default router_cgi