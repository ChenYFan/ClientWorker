import cwpkgjson from './../../../package.json';
export default {
    title: 'ClientWorker',
    description: '一个基于规则的前端路由拦截器',
    lang: 'zh-CN',

    head: [
        //['link', { rel: 'icon', href: '/favicon.png' }],
        ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, target-densitydpi=device-dpi' }],
        ['link', { href: 'https://npmm/lightgallery@2.3.0/css/lightgallery.css', rel: 'stylesheet' }],
        ['script', { src: 'https://npmm/lightgallery@2.3.0/lightgallery.min.js' }],
        ['script', { src: `https://npmm/clientworker@${cwpkgjson.version}/dist/autoupdate.js` }]
    ],

    lastUpdated: true,
    themeConfig: {
        socialLinks: [
            { icon: 'github', link: 'https://github.com/ChenYFan/ClientWorker' }
        ],
        nav: [
            // NavbarItem
            {
                text: '首页',
                link: '/',
            },
            {
                text: '规则',
                link: '/rule/',
            },
            {
                text: '例子',
                link: '/example/parallelcdn',
            },
            {
                text: '拓展',
                link: '/ext/engine',
            },
            {
                text: 'Q群',
                link: 'https://jq.qq.com/?_wv=1027&k=rAcnhzqK',
            },
            {
                text: '优秀配置',
                link: 'https://github.com/ChenYFan/ClientWorker/discussions/categories/awesome-example'
            }
        ],
        sidebar: [
            {
                text: '上手',
                items: [
                    { text: '开始', link: '/start' }
                ]
            },
            {
                text: '规则书写',
                items: [
                    { text: '捕捉与搜索 | Search & Catch', link: '/rule/' },
                    { text: 'url重写/并发 | url replace/parallel', link: '/rule/replace' },
                    { text: '重定向 | redirect', link: '/rule/redirect' },
                    { text: '返回响应 | return', link: '/rule/return' },
                    { text: '重写标头 | header', link: '/rule/header' },
                    { text: '发起请求 | fetch', link: '/rule/fetch' },
                    { text: '跳过处理 | skip', link: '/rule/skip' },
                    { text: '自定义脚本 | script', link: '/rule/script' }
                ]
            },
            {
                text: '例子',
                items: [
                    { text: '如何解决JSDelivr等cdn在境内加载缓慢问题', link: '/example/parallelcdn' },
                    { text: 'WEBP兼容计划', link: '/example/autowebp' },
                    { text: '如何自动更新配置和ClientWorker', link: '/example/autoupdate' },
                    { text: '转发、并发、绕备', link: '/example/forward' }
                ]
            },
            {
                text: '拓展',
                items: [
                    { text: '自动清理过期缓存', link: '/ext/autoclean' },
                    { text: "热更新", link: "/ext/hotupdate" },
                    { text: '关于引擎', link: '/ext/engine' },
                    { text: "内置API接口", link: "/ext/api" }
                ]
            }
        ]
    }
}
