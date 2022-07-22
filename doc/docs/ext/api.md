# API

ClientWorker默认会劫持`/cw-cgi/`作为前端控制台响应，也提供了一个api接口，格式为`/cw-cgi/api?type=API类型`

对其发起请求可以触发ClientWorker特定功能。

这是API类型:

## `config` 

> 任何请求方式均可

更新`config.yml`配置，并自动转为`json`，成功返回`ok`。

## `clear`

> 任何请求方式均可

清除`ResponseCache`缓存，成功返回`ok`。（不会清除配置）

## `hotpatch`

> 任何请求方式均可

热更新ClientWorker接口，请见[热更新 - ClientWorker热补丁](/ext/hotupdate.html#ClientWorker热补丁)。

## `hotconfig`

> 任何请求方式均可

热更新ClientWorker接口，请见[热更新 - Config热配置](/ext/hotupdate.html#Config热更新)。

## `version`

返回版本号，这也是指示ClientWorker安装成功的表现。