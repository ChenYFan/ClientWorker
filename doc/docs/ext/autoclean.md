#  过期缓存自动清除

ClientWorker内置了一个定时器，在每次启动时被激活，用于循环定时检测并删除过期缓存。

循环的时间默认是一分钟，你可以修改`config.yaml`配置来决定定时器的时间间隔。（支持表达式）

```yaml
name: ClientWorker Docs Config
cleaninterval: 1000*20 # 每20秒检测并清理一次
```

> ClientWorker在依赖的页面被关闭时会存活大约1分钟。被ClientWorker被杀死后过期的缓存不会被清理。直到下一次激活才会重新清理。