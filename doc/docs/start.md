# 快速开始

ClientWorker能干什么？

- 绕备，在域名不变动的情况下，其余用户所有请求均可以定向到你的其他服务器或者cdn，而首屏域名无需ICP备案。
- 降本，你可以用廉价的家宽+公网ipv4/ipv6，即使是80/443被封锁，你也可以在不变动端口的情况下将用户流量引向家宽。
- 白嫖，可以用免费的公网穿透服务，接近零成本托管你的服务。
- 加速，将静态资源流量（乃至动态资源）**并发**到全球cdn，实现前端级负载均衡。
- 绕禁，通过在前端修改标头的方式，修复被故意篡改的`MIME`，正常托管网站，绕过各大托管商对于网站部署的限制，可以毫无负担的使用阿里云、腾讯云等对象存储而不用开启网站模式，乃至GithubRaw无限流量（绕过GithubPage 100GB限制）。
- 愈合：通过并发方式，辅助JSDelivr、Unpkg、cdnjs等大陆几乎不可达请求重定向至其他cdn，从而实现无修改、全球加速。
- 不宕机，即使首屏服务器离线或不可达，已访问过的用户依旧可以正常命中备用服务器。
- 缓存，颗粒化控制缓存，多种情况不同选择，智能调度缓存和请求，避免有缓存时无返回、缓存无法及时更新问题，确保缓存在客户端工作的更顺畅。
- 离线，可以迅速支撑普通离线应用，助力快速构建PWA。
- Webp无缝，可以通过判断标头来判断是否支持Webp，并且自动替换图片请求，为网站加速助力。
- 审核，通过内置的规则可以屏蔽并替换、拦截敏感词汇，实现网站内容安全。
- 无刷新，你不需要刷新就可以激活ClientWorker
- 高度自定义...更多玩法等你挖掘

> 首屏加载不在ClientWorker捕捉范围内

## 在开始之前...

1. ServiceWorker是一个注册在指定源和路径下的事件驱动worker。而ClientWorker是利用规则全局驱动sw的插件。
2. ClientWorker目前涵盖了ServiceWorker的 路由拦截、路由劫持、请求/响应（标头、状态、响应主体）修改、缓存调控，允许用户并发（双引擎），并且有一个自定义规则系统，可以自定义规则，拦截请求，修改响应，缓存颗粒化等功能。
3. ClientWorker目前不兼容原有的ServiceWorker，请通过修改Scope绕开相互的作用域。
4. **ClientWorker需要在`HTTPS`环境下工作，`HTTP`将直接安装失败**




## PlanA - 三文件全域安装

> 一般来讲PlanA只要在网站目录下存放三个文件即可，其余文件可以不存；必须要求第一次必须命中404.html，不的存在index.html

> 这对SEO影响很大（Google会提示额外的计算开销，而百度完全没办法爬取）如果你不想影响原来的网站，请查看PlanB

> 但这也是最简单的接入方法，网站下只要存放关键的三个文件即可，此文档就是用PlanA接入的，其静态页面[在这里](https://github.com/ChenYFan/ClientWorker/tree/gh-pages)

1. 进入[ClientWorker Github Release发布页](https://github.com/ChenYFan/ClientWorker/releases)，下载最新版本内容。

2. 解压，将文件夹中`404.html`和`cw.js`拷出，放在网页服务器下

3. 在相同路径新建一个`config.yml`，里面写上:

```yaml
name: ClientWorker 
catch_rules: 
  - rule: _ 
    transform_rules:
      - search: \#.+ 
        searchin: url 
        replace: ''
      - search: _ 
        action: fetch
        fetch:
          engine: fetch 
      - search: (^4|^5) 
        searchin: status 
        action: return 
        return: 
          body: The Full Installation is enabled!
          status: 503
```

4. 启动服务器，用[先进的浏览器访问](https://caniuse.com/?search=ServiceWorker)，如果页面跳转几下之后显示`The Full Installation is enabled!`，则成功。

这就结束了？是的！至少安装过程是结束了，全域安装的目的是为了让ClientWorker托管整个域名下的所有请求，因此我们通常建议在全域托管下只要存放三个文件`cw.js`、`404.html`、`config.yml`即可。

接下来你要[编写规则](/rule/)，让ClientWorker正确拦截你的请求，并且转换成你想要的响应。

## PlanB - 自定义安装 - 无刷新安装

> PlanB对SEO几乎没有影响，非常适合常规网站的接入

1. 进入[ClientWorker Github Release发布页](https://github.com/ChenYFan/ClientWorker/releases)，下载最新版本内容。
2. 解压，将文件夹中`cw.js`拷出，放在网页服务器下
3. 修改你网页的模板，添加一段html

> 用户每次访问时都应该能运行接下来的脚本，如果你使用hexo等其他博客系统，可以在body或footer模板中添加这一段。

> 我们强烈建议将这段代码加入在`<head>`标签中，越靠前越好，`navigator.serviceWorker.register`是异步函数不会阻塞页面加载。

> 请不要使用`window.stop()`

```html
<script>if (!!navigator.serviceWorker) {
    navigator.serviceWorker.register('/cw.js?t=' + new Date().getTime()).then(async (registration) => {
        if (localStorage.getItem('cw_installed') !== 'true') {
            const conf = () => {
                console.log('[CW] Installing Success,Configuring...');
                fetch('/cw-cgi/api?type=config')
                    .then(res => res.text())
                    .then(text => {
                        if (text === 'ok') {
                            console.log('[CW] Installing Success,Configuring Success,Starting...');
                            localStorage.setItem('cw_installed', 'true');
                            //如果你不希望重载页面，请移除下面五行
                            fetch(window.location.href).then(res => res.text()).then(text => {
                                document.open()
                                document.write(text);
                                document.close();
                            });
                        } else {
                            console.log('[CW] Installing Success,Configuring Failed,Sleeping 200ms...');
                            setTimeout(() => {
                                conf()
                            }, 200);
                        }
                    }).catch(err => {
                        console.log('[CW] Installing Success,Configuring Error,Exiting...');
                    });
            }
            setTimeout(() => {
                conf()
            }, 50);
        }
    }).catch(err => {
        console.error('[CW] Installing Failed,Error: ' + err.message);
    });
} else { console.error('[CW] Installing Failed,Error: Browser not support service worker'); }</script>
```

4. 在网站`/`目录下新建一个`config.yml`，里面写上:

```yaml
name: ClientWorker 
catch_rules:
  - rule: _
    transform_rules:
      - search: \#.+
        searchin: url
        replace: ''
      - search: _ 
        action: fetch
        fetch:
          engine: fetch 
      - search: (^4|^5) 
        searchin: status 
        action: return
        return:
          body: The GateWay is down!This Page is provided by ClientWorker!
          status: 503
```

5. 启动服务器，用[先进的浏览器访问](https://caniuse.com/?search=ServiceWorker)，如果页面跳转几下之后显示你原本的网页，安装就算成功了。如果返回`The GateWay is down!This Page is provided by ClientWorker!`，你需要检查原服务器有无出现故障。

> 如果你的应用无法通过`document.write`方式无刷新重载，请`window.location.reload()`直接重载页面

接下来你要[编写规则](/rule/)，让ClientWorker正确拦截你的请求，并且转换成你想要的响应。

## PlanC - 接入安装

> 高级用户玩法，普通人勿入

如果你的应用本来就存在`ServiceWorker`，请直接`import`ClientWorker的`/main/handle/main.js`即可，函数名为`clientworkerhandle`