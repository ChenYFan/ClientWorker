# 用户自定义脚本

```yaml
- search: _
  action: script
  script:
    #用户自定义脚本参数
```

ClientWorker在用户指定`name`或`function`后，会将以下参数传递过去：

```json
{
    fetched: <Boolean>,
    response: <Response>,
    request: <Request>
}
```

其中：

- `fetched` 是否已经获取到响应，如果为`true`，则`response`和`request`是有效的。但之后脚本对`request`的操作将不会生效。
- `request` 当前ClientWorker处理的请求
- `response` 如果`fetched`为`true`，则为当前ClientWorker处理的响应` 

ClientWorker要求返回的值格式必须如下：

```json
{
    fetched: <Boolean>,
    response: <Response || undefined>,
    request: <Request || undefined>
}
```

其中：
- `fetched` 表明此次自定义脚本操作是否已获取响应。如果为`true`，ClientWorker将会标记总请求为已执行，规则中的`fetch`操作将不会执行。
- `request` 如果`fetched`为`false`，ClientWorker会将步骤中的请求替换为脚本返回的值。
- `response` 如果`fetched`为`true`，ClientWorker会将步骤中的响应替换为脚本返回的值。


## `name`

当配置中指定name时，ClientWorker会执行名为`name`的函数。

```yaml
- search: \/gettime$
  action: script
  script:
    name: gettime
    skip: true
```

你需要在`cw.js`中指定gettime函数：

```js
const gettime = async (args) =>{
    return {
        fetched:true,
        response:new Response(new Date().toString())
    }
}
```

## `function`

当配置中指定function时，ClientWorker会执行指定的函数。

```yaml
- search: \/timefunction$
  action: script
  script: 
    function: ()=>{return {fetched:true,response:new Response(new Date().toString())}}
    skip: true
```

这适合一些简单的函数。你可以查看[部署在文档中的此样例](/timefunction)


## `skip`

当其值为`true`并且函数返回值中`fetched`也为`true`，ClientWorker将会终止执行接下来的规则，直接返回响应。


