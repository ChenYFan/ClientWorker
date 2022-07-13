# API

ClientWorker默认会劫持`/cw-cgi/`作为前端控制台响应，也提供了一个api接口，格式为`/cw-cgi/api?type=API类型`

这是API类型:

## `config` 

> 任何请求方式均可

更新`config.yml`配置，并自动转为`json`，成功返回`ok`。

## `clear`

> 任何请求方式均可

清除`ResponseCache`缓存，成功返回`ok`。（不会清除配置）
