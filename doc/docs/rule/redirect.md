# URL重定向 `redirect`

```yaml
- search: ——
  action: redirect
  redirect: 
    #跳转参数
```

> 你要找的是在外部观察url不跳转的[URL重写](/rule/replace)吗？
`redirect`可以直接返回一个跳转，无视`fetch`状态，对接下来的规则也将不执行。

## `to`

`to`表示重定向的替换规则。

这是一个简单的例子，用于将`/path`跳转为`/path.html`

```yaml
- search: \/([^\/.]+)$ #匹配/path，跳为/path.html
  action: redirect
  redirect: 
    to: /$1.html
    status: 301
```



## `url`

`url`表示重定向的目标url。

这是一个简单的例子，将`/google`跳转到`https://www.google.com`

```yaml
- search: \/google$
  action: redirect
  redirect: 
    url: https://google.com #不替换直接跳转，默认优先级url > to
    status: 301
```

> 请注意，`url`优先级比`to`高。

## `status`

你可以选择301/302，不过这其实没有太大用处。
