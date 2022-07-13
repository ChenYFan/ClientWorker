# 发起请求 `fetch`

`fetch`这一操作在ClientWorker中至关重要，它意味着：

- 之后所有的修改都将作用于Response，而非Request。
- 这意味着`status`和`statusText`将允许修改
- 这意味着`header`将修改于Request
- 这意味着对于url路由的修改将失效，之后对于路由可以再捕获，但`replace`无效

ClientWorker遍历完所有规则后如果发现没有任何`fetch`操作，将会自动执行`fetch`，单线程为`fetch`引擎，多线程为`classic`

> 动态网站如果对多个服务器并发，需要做好防重放准备

# 参数

## `engine`

引擎选项有三个选择，他们分别是：

- `fetch`
- `classic`
- `parallel`

`fetch`是单线程引擎，用于当前请求为一个时使用。

`classic`是并发引擎，当你[replace](/rule/replace)时将其转化成了数组时使用。

`parallel`是并发引擎，与`classic`相同。

当你在单请求时选择了并发引擎，ClientWorker会将其视为错误并降级为单线程。
当你在多请求时选择了单线程引擎，ClientWorker会将其视为错误并升级为`classic`引擎。

```yaml
- search: _ 
  action: fetch
  fetch:
    engine: classic
```

### 引擎差异

- `classic` 基于响应内容判断的引擎，它会并发所有请求，直到任意一个请求返回正确的`status`**以及完整的响应内容**，核心是重构响应，在请求速度差异不大时**会造成少许流量浪费**。对于流式下载无法支持或异常缓慢。
- `parallel` 基于响应状态的引擎，它会并发所有请求，直到任意一个请求返回正确的`status`，核心是`Event`调度，几乎没有流量浪费，支持流式下载。

这是[完整的两者引擎差异比较](/ext/engine)

## `status`

为`fetch`期望得到的响应状态，不满足状态此分响应将被忽略。可以避免任意一引擎以**最快的速度返回错误界面**这一尴尬问题。默认为`200`

```yaml
- search: _ 
  action: fetch
  fetch:
    status: 200
```

## `preflight`

至关重要的配置，用于避免当前请求非[`simple_requests`](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests)时，浏览器意外发出的`OPTIONS`请求。当`preflight`为`false`时，请求将会降级成`simple_requests`，ClientWorker将会做以下处理：

- 如果请求方式是`GET` `POST` `HEAD`，则不变请求方式，否则转化为`GET`
- 如果请求方式是`POST`，则不变`body`，否则移除`body`
- 对于`header`，ClientWorker将会直接移除所有头，详情请见[header](/rule/header)

此配置适用于外部cdn请求，大部分公共cdn是不会对`OPTIONS`请求做CORS，这会造成意外的错误。而关闭`preflight`则可以避免。

```yaml
- search: ^https\:\/\/((cdn|fastly|gcore)\.jsdelivr\.net|unpkg\.com)
  action: fetch
  fetch:
    preflight: false
```

## `timeout`

超时配置，如果超出此时间，请求将直接返回一个错误界面，其状态代码为503，默认为5000ms。单位为毫秒。

```yaml
- search: ^https\:\/\/((cdn|fastly|gcore)\.jsdelivr\.net|unpkg\.com)
  action: fetch
  fetch:
    timeout: 10000
```

## `cache`

> 请注意`cache`不再是原生`fetch init`，缓存由ClientWorker控制

在`fetch`时，ClientWorker会在当前规则处理下的响应给予一个`clientworker_cachetime`标头，为缓存填充时的时间

只要存在`cache`这个选项，则会开启缓存。

> 无论缓存是否响应，原请求会一直进行并且在后台自动更新缓存。

### `expire`

缓存过期时间，可以为表达式。单位为毫秒。默认`0`表示瞬间过期。

```yaml
- search: ^https\:\/\/((cdn|fastly|gcore)\.jsdelivr\.net|unpkg\.com)
  action: fetch
  fetch:
    expire: 1000*60*60*24*365 #CDN默认缓存一年
- search: \@latest\/
  action: fetch
  fetch:
    expire: 1000*60*60 #latest缓存一小时
```

### `delay`

表示在有缓存的情况且缓存还未过期时，接到请求后多久返回缓存。即原请求超时多少后才返回缓存，这样既可以避免缓存无法及时更新，又可以节约源服务器长时间无法响应的问题。

**不支持表达式**，默认200ms

> 这个值应该比timeout小

```yaml
- search: _
  action: fetch
  fetch:
    delay: 200 #请求200ms后返回缓存
```

### `expired_delay`

表示缓存过期时返回缓存的延迟时间，避免有缓存时服务器宕机后ClientWorker无返回问题

**不支持表达式**，默认3000ms

> 这个值应该比timeout小

```yaml
- search: _
  action: fetch
  fetch:
    expired_delay: 500 #请求200ms后返回缓存
```



## 原生`fetch`参数 `init`

包含以下内容，ClientWorker将会附加在引擎中（包括并发）

- `mode`
- `credentials`
- `redirect`

```yaml
- search: ^https\:\/\/((cdn|fastly|gcore)\.jsdelivr\.net|unpkg\.com)
  action: fetch
  fetch:
    redirect: follow
```

你可以参阅[MDN - fetch() init](https://developer.mozilla.org/en-US/docs/Web/API/fetch#init)来配置`fetch`