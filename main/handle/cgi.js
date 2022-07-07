import yaml from 'js-yaml'
import CacheDB from '@chenyfan/cache-db'
const router_cgi = async (request) => {
    const db = new CacheDB()
    const urlStr = request.url.toString()
    const urlObj = new URL(urlStr)
    const pathname = urlObj.pathname
    switch (pathname.split('/')[2]) {
        case '':
            return new Response('Hello, Client Worker!')
        case 'update_config':
            const config = await fetch('/config.yaml').then(res => res.text()).then(text => yaml.load(text))
            await db.write('config', JSON.stringify(config), { type: "json" })
            console.log(await db.read('config', { type: "json" }))
            return new Response(JSON.stringify(config))
        default:
            return new Response('Not Found!, Client Worker!')
    }
}
export default router_cgi