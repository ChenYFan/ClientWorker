# 快速开始
## 在开始之前...

1. ServiceWorker是一个注册在指定源和路径下的事件驱动worker。而ClientWorker是利用规则全局驱动sw的插件。
2. ClientWorker目前只涵盖了ServiceWorker的 路由拦截、路由劫持、请求/响应（头、状态）修改，未来将支持缓存控制、请求/响应（内容）修改。
3. ClientWorker目前不兼容原有的ServiceWorker，请通过修改Scope绕开相互的作用域。
4. **ClientWorker需要在`HTTPS`环境下工作，`HTTP`将直接安装失败**

## PlanA - 全域安装

1. 进入[ClientWorker Github Release发布页](https://github.com/ChenYFan/ClientWorker/releases)，下载最新版本内容。
2. 解压，将`/dist/`文件夹中`404.html`和`cw.js`拷出，放在网页服务器下

> 你要确保当前路径下没有index.html，即用户无论访问哪个网页，第一次请求的一定是404.html。我们更建议将两个文件单独放在一个文件夹

3. 在相同路径新建一个`config.yml`，里面写上:

```yaml
name: ClientWorker #自定义名称
catch_rules: #转换规则
    - rule: _ #ClientWorker语法糖，匹配当前域，返回一个域名带端口
      transform_rules:
          - search: \#.+ #在发送请求时匹配#后内容并移除
            type: url #支持url status statusCode，默认url
            replace: ''
          - search: _ #ClientWorker语法糖，匹配与catchrule相同的规则
            action: fetch #正常请求
            fetch:
              engine: fetch #单请求引擎，默认fetch
          - search: (^4|^5) #匹配4XX/5XX状态码
            type: status #在status中匹配
            action: return #直接返回
            return: #返回内容
              body: The Full Installation is enabled!
              status: 503
```

4. 启动服务器，用[先进的浏览器访问](https://caniuse.com/?search=ServiceWorker)，如果页面跳转几下之后显示`The Full Installation is enabled!`，则成功。

这就结束了？是的！至少安装过程是结束了，全域安装的目的是为了让ClientWorker托管整个域名下的所有请求，因此我们通常建议在全域托管下只要存放三个文件`cw.js`、`404.html`、`config.yml`即可。

接下来你要[编写规则](/rule/)，让ClientWorker正确拦截你的请求，并且转换成你想要的响应。

## PlanB - 自定义安装

1. 进入[ClientWorker Github Release发布页](https://github.com/ChenYFan/ClientWorker/releases)，下载最新版本内容。
2. 解压，将`/dist/`文件夹中`cw.js`拷出，放在网页服务器下
3. 修改你网页的模板，添加一段html

> 用户每次访问时都应该能运行接下来的脚本，如果你使用hexo等其他博客系统，可以在body或footer模板中添加这一段。

```html
<script>
window.addEventListener('load', async () => {
    if (window.localStorage.getItem('ClientWorkerInstall') === 'true' && window.localStorage.getItem('ClientWorkerConfig') !== 'true') {
        await fetch('/cw-cgi/api?type=config').then(res => res.text())
        .then(res=>{
            if(res==='ok'){
                window.localStorage.setItem('ClientWorkerConfig', 'true')
                window.location.reload()
            }else{
                console.error(`ClientWorkerConfig Error:${res}`)
            }
        })
    } else {
        navigator.serviceWorker.register(`/cw.js?time=${new Date().getTime()}`)
            .then(async reg => {
                if(window.localStorage.getItem('ClientWorkerConfig') === 'true')return;
                console.log('ClientWorker Installed,Need to reload page to Config!')
                window.localStorage.setItem('ClientWorkerInstall', 'true');
                setTimeout(() => {
                    window.location.search = `?time=${new Date().getTime()}` //#1
                }, 200)
            }).catch(err => {
                console.error(`ClientWorker Install Failed:${err}`)
            })
    }
});
</script>
```

4. 在网站`/`目录下新建一个`config.yml`，里面写上:

```yaml
name: ClientWorker #自定义名称
catch_rules: #转换规则
    - rule: _ #ClientWorker语法糖，匹配当前域，返回一个域名带端口
      transform_rules:
          - search: \#.+ #在发送请求时匹配#后内容并移除
            type: url #支持url status statusCode，默认url
            replace: ''
          - search: _ #ClientWorker语法糖，匹配与catchrule相同的规则
            action: fetch #正常请求
            fetch:
              engine: fetch #单请求引擎，默认fetch
          - search: (^4|^5) #匹配4XX/5XX状态码
            type: status #在status中匹配
            action: return #直接返回
            return: #返回内容
              body: The GateWay is down!This Page is provided by ClientWorker!
              status: 503
```

4. 启动服务器，用[先进的浏览器访问](https://caniuse.com/?search=ServiceWorker)，如果页面跳转几下之后显示你原本的网页，安装就算成功了。如果返回`The GateWay is down!This Page is provided by ClientWorker!`，你需要检查原服务器有无出现故障。