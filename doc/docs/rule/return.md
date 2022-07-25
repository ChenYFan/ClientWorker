# 返回响应 `return`

```yaml
- search: _
  action: return
  redirect: 
    #返回参数
```


`return`可以直接返回一个响应，无视`fetch`状态，对接下来的规则也将不执行。

## `body`

返回的响应的body是一个字符串：


```yaml
- search: \/error$
  action: return
  redirect: 
    body: error
```

## `status`

指定返回的状态码，默认是200。

```yaml
- search: \/error599$
  action: return
  redirect: 
    body: error599
    status: 599
```

## `header`

指定返回的header，应该是一个键值对。

```yaml
- search: \/error$
  action: return
  redirect: 
    body: <h1>error</h1>
    header: 
      Content-Type: text/html
      X-Custom-Header: custom
```