# Engine

ClientWorker中拥有五款原理不同的并发引擎，他们分别是`fetch` `Crazy` `Classic` `Parallel` `KFCThursdayVW50`。

> ~~虚假的疯狂引擎 `Crazy` 真实的疯狂引擎`KFCThursdayVW50`~~

> `KFCThursdayVW50`原名`Hysteria`（歇斯底里的），但再疯狂也比不过周四KFC吧:)

在这其中，`fetch`（JS原始请求方式） 与 `Crazy`是单请求输入引擎，`Classic` 、 `Parallel` 与 `KFCThursdayVW50` 是多请求输入引擎。这意味着后面两个引擎可以同时对多个地址发起请求，而前面两个引擎只能对单个地址发起请求。请注意，除了`fetch` 之外，其他引擎都是**多线程的**，非多线程请求将会被降级。

> **注意：**
> `fetch` `Crazy`  只接受字符串形式的url
> `Classic` `Parallel` `KFCThursdayVW50` 只接受数组形式的urls

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

`Parallel`支持流下载.

# `Crazy`

`Crazy`会在刚开始发起一个只下载1个字节的请求`Range 0~1`，用于检查文件总大小（这被称为`PreFetch`）。如果总大小不存在或者比线程还小，则会降级为`normal fetch`。

此后`Crazy`将发起共`线程数`个大小为`总大小÷线程数`的请求，并发下载，最后合并为一个响应主体，并将`PreFetch`中的标头与状态还原。

> 由于浏览器对于一个域名的请求限制，我们通常建议将线程数调小为4以下

这种方式推荐请求字体、无法流式的图片、无法流式的音视频等等。

> 对于较小的文件，加速效果并不显著，乃至可能会出现**减速**

> （4线程）通常10M左右的字体可以显著提速1.5倍上下

这是一张近7M的图片，你可以打开F12观察它的请求状况

![](https://cdn.jsdelivr.net/npm/chenyfan-happypic@0.0.33/1.jpg)

# `KFCThursdayVW50`

> <sub>一个疯狂的引擎...</sub>

`KFCThursdayVW50`会在刚开始对**所有源**发起一个只下载1个字节的请求`Range 0~1`，用于检查文件总大小（这被称为`PreFetch`）。如果总大小不存在或者比线程还小，则会降级为`parallel`。

此后`KFCThursdayVW50`将**对每一个源**发起共`线程数`个大小为`总大小÷线程数`的请求，并发下载，在任何一个源响应正确代码后打断当前组的其余请求，最后合并为一个响应主体，并将`PreFetch`中的标头与状态还原。

> 并发的总请求为线程数*源个数

这种方式可以叠加不同镜像的带宽，适合下载较大的文件。

> 非常不建议对静态资源使用此引擎，过多的线程可能会导致用户浏览器意外崩溃。

> 对于较小的文件会起到**减速的效果**

> （4线程，4镜像）对于一个存储在Sharepoint的2GB文件，可以显著提速近7倍速度（30MB/s->200MB/s）