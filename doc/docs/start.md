# 快速开始

ClientWorker能干什么？

- 绕备，在域名不变动的情况下，其余用户所有请求均可以定向到你的其他服务器或者cdn，而首屏域名无需ICP备案。
- 降本，你可以用廉价的家宽+公网ipv4/ipv6，即使是80/443被封锁，你也可以在不变动端口的情况下将用户流量引向家宽。
- 白嫖，可以用免费的公网穿透服务，接近零成本托管你的服务。
- 加速，将静态资源流量（乃至动态资源）**并发**到全球cdn，实现前端级负载均衡。
- 绕禁，通过在前端修改标头的方式，修复被故意篡改的`MIME`，正常托管网站，绕过各大托管商对于网站部署的限制，可以毫无负担的使用阿里云、腾讯云等对象存储而不用开启网站模式，乃至GithubRaw无限流量（绕过GithubPage 100GB限制）。
- 愈合：通过并发方式，辅助JSDelivr、Unpkg、cdnjs等大陆几乎不可达请求重定向至其他cdn，从而实现无修改、全球加速。
- 不宕，即使首屏服务器离线或不可达，已访问过的用户依旧可以正常命中备用服务器。
- 缓存，颗粒化控制缓存，多种情况不同选择，智能调度缓存和请求，避免有缓存时无返回、缓存无法及时更新问题，确保缓存在客户端工作的更顺畅。
- 离线，可以迅速支撑普通离线应用，助力快速构建PWA。
- 兼容，Webp无缝，可以通过判断标头来判断是否支持Webp，并且自动替换图片请求，为网站加速助力。
- 审核，通过内置的规则可以屏蔽并替换、拦截敏感词汇，实现网站内容安全。
- 无刷，你不需要刷新就可以激活ClientWorker
- 热更，即使源站完全宕机，你也可以更新用户手中的ClientWorker与配置，确保网站正常运行。
- 切片，对于一个请求发起多个切片以提高单文件下载速度
- 叠速，专门为ClientWorker开发的`KFCThursdayVW50`引擎能在浏览器端切片并同时并发不同的镜像服务器，对于下载大文件可以带宽叠加的效果。
- 均衡，对多个镜像并发，选择最优的镜像服务器，保证网站的响应速度，同时达到负载均衡的目的。
- 高度自定义...更多玩法等你挖掘

> 首屏加载不在ClientWorker拦截范围内

## 在开始之前...

1. ServiceWorker是一个注册在指定源和路径下的事件驱动worker。而ClientWorker是利用规则全局驱动sw的插件。
2. ClientWorker目前涵盖了ServiceWorker的 路由拦截、路由劫持、请求/响应（标头、状态、响应主体）修改、缓存调控，允许用户并发（双引擎），并且有一个自定义规则系统，可以自定义规则，拦截请求，修改响应，缓存颗粒化等功能。
3. ClientWorker目前不兼容原有的ServiceWorker，请通过修改Scope绕开相互的作用域。
4. **ClientWorker需要在`HTTPS`环境下工作，`HTTP`将直接安装失败**

我们明确一下我们的目的，首先，我们要放置好ClientWorker原始代码；然后，我们要在用户需要安装cw的位置填入ClientWorker安装代码，将其安装到用户浏览器中；最后，我们要写入想要达到目的的配置，完成ClientWorker的接入。

## Step 1 放置ClientWorker

你有两种选择：`CDN接入`和`本地托管接入`，任选其一即可，推荐CDN接入。

### CDN接入 - 一行代码的事儿

> 我们~~墙裂~~建议用此方式安装，这样你就可以很方便使用自定义函数控制cw的行为了。

在你的网站**根目录**下新建一个名为`cw.js`的文件，里面写上：

```js
importScripts('https://lib.baomitu.com/clientworker/latest/dist/cw.js')
```

> 我们非常、非常强烈建议在引入脚本时要指定clientworker的版本(而不是latest)，最新版本可以到[Release](https://github.com/ChenYFan/ClientWorker/releases)查看，然后引入代码改为：
>
> ```js
> importScripts('https://lib.baomitu.com/clientworker/2.8.1/dist/cw.js') //请及时替换2.8.1为最新版本号
> ```

如果在国外，你可以使用CloudFlare提供的CDNJS镜像接入：

```js
importScripts('https://cdnjs.cloudflare.com/ajax/libs/clientworker/2.8.1/dist/cw.js') //请及时替换2.4.0为最新版本号
```

你也可以使用其他cdnjs镜像。

> 如果有必要，你也可以用npm镜像或者github镜像接入，比如：
> ```js
> importScripts('https://cdn.jsdelivr.net/npm/clientworker@latest') //最好指定版本
> importScripts('https://cdn.jsdelivr.net/gh/chenyfan/clientworker@gh-pages/cw.js') ////最好指定版本

> ClientWorker将会直接托管`fetch`事件，不过你可以在底下写其他事件监听，比如`message`等。同时你可以书写其他自定义函数，在配置中引入。

### 本地托管接入

1. 进入[ClientWorker Github Release发布页](https://github.com/ChenYFan/ClientWorker/releases)，下载最新版本内容。

2. 解压，将文件夹中`cw.js`拷出，放在网页服务器**根目录**下


## Step 2 写入配置 - 最简单，也是最难的一步

在**根目录**下新建一个`config.yaml`，填入配置。

> # 配置哪儿来
> 你可以阅读这篇文档，自己填写配置，也可以在[社区的Awesome Exapmle](https://github.com/ChenYFan/ClientWorker/discussions/categories/awesome-example)寻找你感兴趣的配置。不过如果你是刚来的，请暂时将下面的配置填入其中。

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


## Step 3 配置安装代码 - 最后一步了，加油！

你有三种方式接入： `三文件全域安装` 、 `自定义无刷新安装` 、 `自定义刷新安装`

其中，`全域安装`最简单，对SEO支持也最恶劣（Google会提示额外的计算开销，而百度完全没办法爬取）。比较适用于自用的、只追求速度的。`自定义无刷新安装`则对你的HTML和JS水平有所要求，对于部分不遵守标准的浏览器兼容性较差，但是这种方法对SEO没有影响，比较适合于对seo注重的网站。`自定义刷新安装`对seo略有影响，会在载入后阻断未经CW的请求并刷新一次，以便于CW及时托管，比较适合于网站提速

### 三文件全域安装

一般来讲PlanA只要在网站目录下存放三个文件即可，其余文件可以不存；**必须要求第一次必须命中404.html，不得存在`index.html`**

1. 进入[ClientWorker Github Release发布页](https://github.com/ChenYFan/ClientWorker/releases)，下载最新版本内容。

2. 解压，将文件夹中`404.html`拷出，放在网页服务器**根目录**下

3. 启动网页服务器。访问`https://你的网站/cw-cgi/hello`，返回`Hello ClientWorker!`即为成功。

4. 接下来，修改`config.yaml`配置，你可以阅读这篇文档，自己填写配置，也可以在[社区的Awesome Exapmle](https://github.com/ChenYFan/ClientWorker/discussions/categories/awesome-example)寻找你感兴趣的配置。如果你有好的配置，我们也乐于见到你将你的配置分享到社区。

### 自定义无刷新安装

> 这种方式有一个重载的动作，即在无刷新的情况下将当前页面重新获取并填充。这可能会出现意外的兼容性错误，请慎行。
> 如果你不需要重载，请将下方重载标识框内的代码删除。不重载的后果就是用户首屏的大部分请求无法被CW拦截。如果你希望用户首屏进入就被托管，请使用`自定义刷新安装`

1. 修改你网页的模板，添加一段html

> 用户每次访问时都应该能运行接下来的脚本，如果你使用hexo等其他博客系统，可以在body或footer模板中添加这一段。

> 我们强烈建议将这段代码加入在`<head>`标签中，越靠前越好，`navigator.serviceWorker.register`是异步函数不会阻塞页面加载。

> 请不要使用`window.stop()`，这会导致重载失效

```html
<script>
if (!!navigator.serviceWorker) {
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
                            //如果你不希望重载页面，请移除下面七行
                            //重载标识 - 开始
                            fetch(window.location.href).then(res => res.text()).then(text => {
                                document.open()
                                document.write(text);
                                document.close();
                            });
                            //重载标识 - 结束
                        } else {
                            console.warn('[CW] Installing Success,Configuring Failed,Sleeping 200ms...');
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
} else { console.error('[CW] Installing Failed,Error: Browser not support service worker'); }
</script>
```


2. 接下来，修改`config.yaml`配置，你可以阅读这篇文档，自己填写配置，也可以在[社区的Awesome Exapmle](https://github.com/ChenYFan/ClientWorker/discussions/categories/awesome-example)寻找你感兴趣的配置。如果你有好的配置，我们也乐于见到你将你的配置分享到社区。

### 自定义刷新安装

`window.stop()`将会阻断当前所有的请求，在安装结束后`window.reload()`将刷新并激活页面，确保除了首屏的`html`之外，其余的请求均被cw捕获。

1. 修改你网页的模板，添加一段html

> 用户每次访问时都应该能运行接下来的脚本，如果你使用hexo等其他博客系统，可以在body或footer模板中添加这一段。

> 我们强烈建议将这段代码加入在`<head>`标签中，越靠前越好，确保`window.stop()`能够尽早终止页面静态加载。

```html
<script>
if (!!navigator.serviceWorker) {
    if (localStorage.getItem('cw_installed') !== 'true') {window.stop();}
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
                            window.location.reload();
                        } else {
                            console.warn('[CW] Installing Success,Configuring Failed,Sleeping 200ms...');
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
    })
} else { console.error('[CW] Installing Failed,Error: Browser not support service worker'); }
</script>
```

2. 接下来，修改`config.yaml`配置，你可以阅读这篇文档，自己填写配置，也可以在[社区的Awesome Exapmle](https://github.com/ChenYFan/ClientWorker/discussions/categories/awesome-example)寻找你感兴趣的配置。如果你有好的配置，我们也乐于见到你将你的配置分享到社区。