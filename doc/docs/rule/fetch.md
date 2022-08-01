# 发起请求 `fetch`

```yaml
- search: _ 
  action: fetch
  fetch:
    #fetch参数
```

`fetch`这一操作在ClientWorker中至关重要，它意味着：

- 之后所有的修改都将作用于Response，而非Request。
- 这意味着`status`和`statusText`将允许修改
- 这意味着`header`将修改于Request
- 这意味着对于url路由的修改将失效，之后对于路由可以再捕获，但`replace`无效

**在3.0.0及之后版本后**，ClientWorker遍历完所有规则后如果发现没有任何`fetch`操作，将会视为[skip](/rule/skip)，跳过所有的路由修改。



> 动态网站如果对多个服务器并发，需要做好防重放准备

# 参数

## `engine`

引擎选项有五个选择，他们分别是：

- `fetch`
- `crazy`
- `classic`
- `parallel`
- `KFCThursdayVW50`

> 请注意，引擎名是大小写敏感的，除了`KFCThursdayVW50`，其余名均为小写。

这是引擎的选择

|请求/源|单请求|多请求|
|---------|--------|--------|
|单源|`fetch`|`crazy`|
|多源多镜像|`classic`或`parallel`|`KFCThursdayVW50`|

当你在单源时选择了多镜像引擎，ClientWorker会将其视为错误并降级为单源`fetch`引擎。

当你在多源选择了单源引擎，ClientWorker会将其视为错误并升级为`parallel`引擎。

> **什么是单源和多源**
> 当你在replace时，如果最终替换结果是一个url，即为单源。当最终替换结果是一个url组（大于一个），则被视为多源，即多镜像。
> 当url组中只包含一个url时，则被视为单源。

> 这不是指线程。事实上除了`fetch`，ClientWorker的所有引擎都是多线程的。

```yaml
- search: _ 
  action: fetch
  fetch:
    engine: classic
    #engine: parallel
    #engine: crazy
    #engine: KFCThursdayVW50
    #engine: fetch
```

### 引擎差异

- `fetch` 平平淡淡的默认引擎
- `crazy` 暴力切片下载，不支持流式下载，支持多线程下载。
- `classic` 基于响应内容判断的引擎，它会并发所有请求，直到任意一个请求返回正确的`status`**以及完整的响应内容**，核心是重构响应，在请求速度差异不大时**会造成少许流量浪费**。对于流式下载无法支持或异常缓慢。
- `parallel` 基于响应状态的引擎，它会并发所有请求，直到任意一个请求返回正确的`status`，核心是`Event`调度，几乎没有流量浪费，支持流式下载。
- `KFCThursdayVW50` 疯狂的暴力多并发下载，可以视为`crazy`和`parallel`的组合。会对所有的镜像进行切片并并发下载，基于状态。

> **Warning**: 
> 请不要随意使用`KFCThursdayVW50`和`Crazy`，这对用户浏览器的压力会非常大，并且对于较小的文件会起到减速的效果。

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

超时配置，如果超出此时间，请求将直接返回一个错误界面，其状态代码为503，默认为5000（多请求引擎是30000）。单位为毫秒。

```yaml
- search: ^https\:\/\/((cdn|fastly|gcore)\.jsdelivr\.net|unpkg\.com)
  action: fetch
  fetch:
    timeout: 10000
```

## `cache`

> 请注意`cache`不再是原生`fetch init`，缓存由ClientWorker控制

在`fetch`时，ClientWorker会在当前规则处理下的响应给予一个`clientworker_cachetime`标头，为缓存填充时的时间。

只要存在`cache`这个选项，则会开启缓存。

ClientWorker会在获得请求时查找缓存：

- 若有缓存且缓存在有效期内：直接返回缓存，不请求
- 若有但过期：并发 请求最新版本、延迟返回缓存。
  - 若在最长延迟时间内请求有响应，则更新缓存，并返回最新版本
  - 若在最长延迟时间内没有响应，则返回缓存，请求最新版本线程不会被阻断，会在后台更新缓存
- 若无：请求最新版本，填入缓存。



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

表示在有缓存的情况且缓存过期时，接到请求后多久返回缓存。即原请求超时多少后才返回缓存，这样既可以避免缓存无法及时更新，又可以节约源服务器长时间无法响应的问题。

**不支持表达式**，默认200ms

> 这个值应该比timeout小

```yaml
- search: _
  action: fetch
  fetch:
    delay: 200 #请求超时200ms后返回缓存
```

## `threads`

多请求引擎配置，仅适用于`Crazy`与`KFCThursdayVW50`引擎。

这代表着对于一个文件应该切多少片用于并发。并发是针对一个url的。

```yaml
- search: ^https\:\/\/bigdata\/bigdata
  action: crazy
  fetch:
    threads: 10
```

> 我们强烈建议将此值设为比4更小的数值，过高的同域名并发会被浏览器挂起。

> 对于单请求`Crazy`而言，并发的请求数相当于设置的线程数
> 对于多请求`KFCThursdayVW50`而言，并发的请求数相当于设置的线程数*源的个数

## `trylimit`

多请求引擎配置，仅适用于`Crazy`与`KFCThursdayVW50`引擎。

这代表着对于一个分请求，最多允许失败多少次。

```yaml
- search: ^https\:\/\/bigdata\/bigdata
  action: crazy
  fetch:
    trylimit: 3
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