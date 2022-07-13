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

感谢[@186526](https://github.com/186526)，是他提醒我试试`Event`调度，并且给出了样例代码，在此基础上我才得以开发出第二套引擎`Parallel`这一引擎。

`Parallel`在并发时会给予每一个进程标记`Event`，并在获取到正确的`Status`后广播打断消息而避免自己被打断，将整个`Instance`(而非`Response`)返回，实际上`Parallel`才更接近正常人所认为的并发引擎。

`Parallel`在理论上由于是直接转发结构没有性能折损；至于流量损耗，请求获得`Status`所消耗的流量相对于内容主体来说几乎忽略不计。

`Parallel`弊端是如果多个并发中，有一个很快地响应了状态代码，但是下载速度很慢，这也会严重拖慢速度。

> 在2.1.0及以上版本，ClientWorker修复了Parallel对相对路径错误处理，采用重构`Request`的方式但保留body，保持其性能不折损。

`Parallel`支持流下载，下面是一张示例图，大约10M，此文档用的也是`Parallel`，你可以观察它是否是流式加载：

![](https://cdn.jsdelivr.net/npm/chenyfan-happypic@0.0.33/1.jpg)