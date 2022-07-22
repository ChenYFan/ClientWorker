# 前端兼容webp

你可以通过如下规则来实现前端Webp自动切换：

```yaml
- rule: ^https\:\/\/imagecdndomain/(.*))\.jpg
  transform_rules:
    - search: image\/webp
      searchin: header
      searchkey: Accept
      replace: .webp
      replacein: url
      replacekey: .jpg
```

当浏览器发起`https://imagecdndomain/1.jpg`请求时，ClientWorker将检查浏览器的`Accept`头，如果包含`image/webp`，则会自动将请求转换为`https://imagecdndomain/1.webp`。如果浏览器不支持Webp，则会自动将请求依旧保持为`https://imagecdndomain/1.jpg`。

> 你需要为你的图片额外准备一张Webp版本。

这是一张jpg图片，当你浏览器支持Webp时，会替换到`webp`并显示`Webp Accept!`；当浏览器不支持Webp时，会显示`Webp Reject!This is a jpg file`。

![Webp Support](https://npmm/chenyfan-os@0.0.0-r24/WEBPTEST.jpg)