# 自动更新配置

ClientWorker外暴露了一个接口`/cw-cgi/api?type=config`，对其作任何请求即可更新配置，只要定时请求这个接口即可完成定时更新。

```js
async function updateConfig() {
        await fetch('/cw-cgi/api?type=config').then(res => res.text()).then(res => {
            if (res === 'ok') {
                console.log(`Config updated`);
            } else {
                console.log(`Config update failed`);
            }
        })
    }
```

你也可以使用ClientWorker的`autoupdate.js`来实现更新。

# 更新ClientWorker

重定向到ClientWorker安装页`/404`即可完成更新，当然更佳的选择是在你自己的网站上定时卸载并重新安装`/cw.js`。

```js
async function updateSW() {
        if (navigator.serviceWorker) {
            navigator.serviceWorker.getRegistrations().then(async registrations => {
                for (let registration of registrations) {
                    await registration.update();
                }
                console.log(`Unregistered service workers`);
            }).then(() => {
                navigator.serviceWorker.register('/cw.js').then(async registration => {
                    console.log(`Registered service worker`);
                    await registration.update();
                })
            })
        }
    };
```

你也可以使用ClientWorker的`autoupdate.js`来实现更新。