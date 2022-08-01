# 捕捉与搜索 `rule` && `search`

> 你需要学会yaml...如果不会的话，菜鸟教程可以帮你快速入门

在ClientWorker中，规则被分为`catch_rules`和`transform_rules`。
`catch_rules`是匹配规则，只能匹配路由。
`transform_rules`只会在`catch_rules`起作用时才会捕获，可以捕获`url` `statusText` `statusCode`，未来将支持`header` 和 `body`.

如果[action为skip](/rule/skip)，或者没有任何规则执行[fetch action](/rule/fetch)，则会跳过对此请求的所有修改，即透传（在用户看来是不经过ClientWorker的）。

# `catch_rules` 
## `rule`

作为路由匹配入口，`catch_rule`在匹配`rule`成功后才会将整个`Request`移交给`transform_rules`。

```yaml
catch_rules:
    - rule: #捕获规则1
      transform_rules:
        - search: #转换规则1
          #转换操作1
        - search: #转换规则2
          #转换操作2
    - rule: #捕获规则2
      transform_rules:
        - search: #转换规则3
        #转换操作3
        - search: #转换规则4
        #转换操作4
```

`catch_rule`是一个数组，`ClientWorker`会从上到下依次匹配，即越靠前的优先级越高。除非遇到`return`、`redirect`操作，否则不会结束匹配。

`catch_rule`必须是`正则`，如果不是，将会抛出错误。

### 语法糖

#### _

在`catch_rule`中 `_` 将会匹配当前网站的主域名(包括端口)，例如：

- `http://www.example.com` 将会匹配得 `www.example.com`
- `http://www.example.com:8080` 将会匹配得 `www.example.com:8080`
- `http://www.example.com/test/` 将会匹配得 `www.example.com`

`_`不是匹配当前`请求`的域名，而是匹配当前`网站`的主域名。

> 如果你要捕获所有请求，请使用`.*`。

# `transform_rules`
## `search`
作为转换入口，`transform_rules`在匹配`search`成功后才会进行处理，格式如下：

```yaml
- rule: #捕获规则
  transform_rules:
  - search: #转换规则1
    action: #转换操作1
    {{action option}}: #转换操作1的参数
  - search: #转换规则2
    replace: #转换操作 - 重写路由
```

每一个路由分为`search`和`action`两个部分，`search`是匹配规则，`action`是转换操作。如果`search`匹配成功，`action`就会被执行。当`action`执行完毕后，`transform_rules`会继续匹配下一个规则。

`transform_rules`是一个数组，`ClientWorker`会从上到下依次匹配，即越靠前的优先级越高。除非遇到`return`、`redirect`操作，否则不会结束匹配。

如果当前请求未执行`fetch`操作，`status` `statusText`是无法修改的，对`header`的修改将会作用于`Request`对象。如果当前请求已经执行`fetch`操作，`status` `statusText`是可以修改的，但`replace`将无法作用于重写路由，对`header`的修改将会作用于`Response`对象。`return` `redirect`操作将会终止匹配，无视`fetch`是否完成，直接返回结果。

同样的，`transform_rules`也是一个数组，`ClientWorker`会从上到下依次匹配，即越靠前的优先级越高。

### 语法糖

#### _

在`transform_rules`中`_`的作用是使用与`catch_rule`相同的规则，而不是匹配当前域名。

- `catch_rule`是`_`，那么`transform_rules`中的`_`就会同时匹配当前网站的主域名，而不是当前请求的域名。

- `catch_rule`是`.*`，那么`transform_rules`中的`_`也会同时匹配整条网址，即捕获全部请求。

## `searchin`

指定`search`的搜索内容，可以为：
- `url`：匹配当前请求的url[默认]
- `status`：匹配当前请求的状态码
- `statusText`：匹配当前请求的状态文本