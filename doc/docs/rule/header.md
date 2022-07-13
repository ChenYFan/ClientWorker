# 更改标头 `header`

这是一个例子，用于修正`.html`后缀文件的标头，避免部分服务商故意不提供网页服务：

```yaml
- search: \.html$ #匹配后缀为.html的请求，修复content-type为text/html
  header: #只有在fetch之后才能修改Response的header，之前修改的均为Request
    content-type: text/html;charset=utf-8
```

你也可以新增、修改header，此处不再举例。

然而需要注意的是：

1. `header`的修改作用与`fetch`状态有关，如果`fetch`前修改，作用将于`请求 Request tReq`；如果已经`fetch`操作后修改，作用将于`响应 Response tRes`。
2. 对于`header`在`fetch`前的修改，如果`fetch`参数`preflight`不为`true`，~~`header`仅会保留以下内容`Accept`，`Accept-Language`，`Content-Language`和`Content-Type`。这其中，`Content-Type`只能为`application/x-www-form-urlencoded`，`multipart/form-data`或`text/plain`。对于指定`preflight`为`false`的请求，ClientWorker将会移除除以上之外的所有header。**大小写敏感**~~  [MDN Simple Request](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests)提到上述头是不受影响的，但是`WebKit`内核有着额外的限制，为了方便配置和统一内核，ClientWorker将会直接移除头。