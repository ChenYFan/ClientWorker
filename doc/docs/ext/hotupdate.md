# 热更新

ClientWorker支持从外部加载和更新ClientWorker及其配置，避免在源站不可达时两者无法更新。

热更新与默认更新方式不同，热更新允许你从除了源站的任何地方获取更新

## ClientWorker热补丁

> **请注意，ClientWorker的热补丁是临时有效的**，用户关闭网页后ClientWorker会暂停，新的补丁会丢失，在下一次重启并**刷新**后才会生效。重启后无需重新下载热补丁，自动生效。

你需要对`hotpatch`进行配置，格式是数组：

```yaml
name: ClientWorker
hotpatch:
    - https://raw.githubusercontent.com/ChenYFan/ClientWorker/gh-pages/cw.js
    - https://cdn.jsdelivr.net/gh/ChenYFan/ClientWorker/cw.js
```

api请求请见[热更新 - ClientWorker热补丁](/ext/api.html)。

在触发时ClientWorker将会把自身临时性替换为最新的版本，重启失效。

## Config热更新

> 持久生效，不会丢失

你需要对`hotconfig`进行配置，格式是数组：

```yaml
name: ClientWorker
hotconfig:
    - https://raw.githubusercontent.com/ChenYFan/ClientWorker/gh-pages/config.yaml
    - https://cdn.jsdelivr.net/gh/ChenYFan/ClientWorker/config.yaml
```

api请求请见[热更新 - Config热更新](/ext/api.html)。

在触发时更新与[正常更新](/example/autoupdate.html)相同，会持久保留。
