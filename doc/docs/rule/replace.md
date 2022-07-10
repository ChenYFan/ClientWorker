# URL重写

## 在开始之前

`ClientWorker`作为浏览器中间件，将会在`Request`发送到服务器之前对`url`进行转换。这种转换是存在于`ServiceWorker`层面，对于用户来说处于黑盒。url的重写在用户层面观察是不会发生变动的。

用一个不恰当的类比就是相当于隐形转发。如果你要显性跳转，请使用[`Redirect`](/rule/redirect)规则。

# 单路由重写

这是一个简单的例子，用于移除url中的所有搜索参数，对于纯静态网站，这个规则很有用

```yaml
- search: \?.*
  replace: ''
```

- `https://example.com` 无匹配
- `https://example.com?q=1` 匹配`?q=1`

这里还有一个较难的例子，用于为`/path/`重写到`/path/index.html`，对于使用对象存储等没有自定义路由规则的第三方存储作为博客的用户可能比较有帮助：

```yaml
- search: ([^\/.]+)\/$
  replace: $1/index.html
```

`$1`表示搜索规则搜索到的第一个匹配结果，这里应该是`/path/`。这属于正则内容，这里不再阐述。

# 并发重写

这种操作类比于[`freecdn`](https://github.com/EtherDream/freecdn)的`自动选择公共库`功能，也是通过多个资源同时并发挑选最快的响应。

这是一个将`jsdelivr`的所有npm流量并发的例子，这个规则对于中国大陆用户来说比较友好：

```yaml
- search: ^https:\/\/(cdn|fastly|test1|gcore)\.jsdelivr\.net\/npm\/
  replace: 
    - https://npm.elemecdn.com/
    - https://unpkg.com/
    - https://unpkg.zhimg.com/
    - _
```

> 在`replace`为数组时，你可以用`_`来表示将原请求也给并发

`replace`只会将`url`重写，对于其它内容将不会修改。

> 需要注意的是，如果你已经将url重写为并发，那么接下来重写功能将失效

> 如果上述规则已经`fetch`过，那么`tReq`将会转化为`tRes`，之后重写功能也会失效