# Engine

ClientWorker中拥有两款原理不同的并发引擎，但他们的核心都是`Promise.any`并发。

但是如果你直接用`Promise.any`并发，并在`fetch`后用`AbortController`打断会导致将当前进程也给打断，由于`fetch`在返回状态`status`时就对`Promise`进行`Resolve`，而此时响应主体还没开始下载。因此，引擎一代称实际上指的是不同的打断方式。

`Promise.any`的兼容性远低于`ServiceWorker`，ClientWorker会自动对其PolyFill，因此ClientWorker兼容性最低要求与ServiceWorker相同。

在刚开始作者曾尝试用`SetTimeout` + `Promise`的方案尝试前端并发，但最终还是发现`Promise.any`是前端最快的并发方案，没有之一。

# `Classic`

由于js界对于ServiceWorker热度属实不高，对于ServiceWorker的使用也大多局限于PWA、缓存和加速，有关其研究和开源项目属实不多。为数不多的几个热门项目`jsproxy`和`freecdn`，两者都是用ServiceWorker开发，但是网络上大部分人只关注效果，很少有人关注原理，对其并发引擎研究也甚少。

作者在先前研究过`freecdn`的并发原理 ~~（但由于作者太菜了没看懂）~~ ，于是作者自己琢磨了一套方案，并在[2022/1/6 第一次提交到了自己的博客](https://github.com/ChenYFan/blog/commit/6fd6b5b4a21262d076252c8539f19348f35e0e38)，效果出奇的不错。

原理详见[作者博客 - 欲善其事，必利其器](https://blog.cyfan.top/p/c0af86bb.html#%E5%B9%B6%E8%A1%8C%E8%AF%B7%E6%B1%82-Request-Parallelly)。核心无非是利用重构`Request`阻塞`fetch`，避免被提前`Abort`。

后来我重新看了一遍[`freecdn的url-loader`](https://github.com/EtherDream/freecdn-js/blob/master/core-lib/src/url-loader.ts)才意识到原来`EtherDream`用的也是这一套方案。~~我瞬间觉得我厉害了起来~~

自然，`Classic`是无法处理流下载和直播（指flv阻塞性直播，对于切片直播无影响）的，并且对于较大的图片也无法做到边下载边显示。如果你比较反感这个，可以考虑`Parallel`

# `Parallel`

然而`Classic`引擎既然是重构`Request`，那不可避免的会造成性能折损。在并发10MB的请求下，单线程的下载时间是`670ms`，而多线程一度达到了`850ms`，延长了将近三成时间。

此外，由于通过阻塞方式绕过状态检测会不可避免地造成冗余流量，上述实验中原图片`10.3MB`，实际流量`13.7MB`，虽然不是特别大但这一情况还是存在。

感谢[@186526](https://github.com/186526)，是他提醒我试试`Event`调度，并且给出了样例代码，在此基础上我才得以开发出第二套引擎`Parallel`。这一引擎

`Parallel`在并发时会给予每一个进程标记`Event`，并在获取到正确的`Status`后广播打断消息而避免自己被打断，将整个`Instance`(而非`Response`)返回，实际上`Parallel`才更接近正常人所认为的并发引擎。

`Parallel`在理论上由于是直接转发结构没有性能折损；至于流量损耗，请求获得`Status`所消耗的流量相对于内容主体来说几乎忽略不计。

但`Parallel`引擎坏就坏在他将整个`Instance`转发，这会直接导致相对路径的处理错误(主要发生在js上)

假设用户在 `https://example.com/` 请求 `index.js`，而`index.js`中会请求`assets/index.css`，那么正常请求路径应该是这样：

```
https://example.com

-> index.js

<- https://example.com/index.js √

-> index.js -> assets/index.css

<- https://example.com/assets/index.css √
```

但如果你使用外部cdn加载，会怎样?

```
https://example.com

-> index.js

<- https://examplecdn.com/package/dist/index.js √

-> index.js -> assets/index.css

<- https://examplecdn.com/assets/index.css ×
```

你会发现，在请求`assets/index.css`时，用户居然错误的请求到了cdn的根目录！这是怎么回事？

原来，`Parralle`引擎会将整个`Instance`移交给请求，这会导致`index.js`会认为自己是从`https://examplecdn.com/package/dist/index.js`加载的(而非`https://example.com/index.js`)，在请求相对路径时由于没有指定绝对url，他自然而然的会将`https://examplecdn.com/`作为根目录加载。

如果想要避免sw外部的js错误识别相对路径，需要重构请求。然而，一旦重构，原理就和`Classic`基本无异，性能折损也无法避免。

而且比较悲催的是，大部分前端应用架构`Vue` `React`他们用的都是相对路径。因此，对于这些应用还得用`Classic`。（这也是本文档使用`Classic`最大原因）

`Parallel`还有一个弊端是如果多个并发中，有一个很快地响应了状态代码，但是下载速度很慢，这也会严重拖慢速度。

# 总结

- 对于`js`一类的脚本，视情况使用，一般建议`classic`
- 对于`css`样式，由于用到了相对路径，一般也建议`classic`
- 对于图片、视频等较大的单文件，一般建议`parallel`
- 对于`flv`直播，则必须使用`parallel`
- 对于`vue` `react`等前端应用，必须使用`classic`