# 纯静态网站加速

你可以将你的网站放在对象存储等其他空间上作为镜像，然后使用以下配置：

```yaml
catch_rules: #转换规则
    - rule: _ #ClientWorker语法糖，匹配当前域，返回一个域名带端口
      transform_rules: #转换规则，最上面的优先最高
        - search: \#.* #在发送请求时匹配#后内容并移除
          replace: ''
        - search: \?.* #在发送请求时匹配?后内容并移除，仅限静态请求
          replace: '' 
        - search: _ 
          replace: 
          - _ #保留原始请求
          - xxx.github.io #GithubPage托管
          - xxx.gitee.io #GiteePage托管
          - unpkg.com/xxx-html@xxx.xxx/dist #NPM托管
          - cdnjs.cloudflare.com/ajax/libs/xxx/xxx.xxx/dist #CDNJS托管（大雾
          - examplebucket.oss-xx-xx.aliyuncs.com #阿里云对象存储托管
          - xxx.tencentcs.com #腾讯对象存储托管
          - xxx.qbox.me

        - search: \.html$
          header:
            Content-Type: text/html;charset=UTF-8 #修复标头

        - search: _
          action: fetch
          fetch:
            status: 200
            engine: classic
            preflight: false
            timeout: 5000
```

**主站和分流站需要HTTPS，ClientWorker在HTTP环境下不工作**

# ICP绕备、家宽、动态加速

```yaml
catch_rules: #转换规则
    - rule: _ #ClientWorker语法糖，匹配当前域，返回一个域名带端口
      transform_rules: #转换规则，最上面的优先最高
        - search: \#.* #在发送请求时匹配#后内容并移除
          replace: ''

        - search: _ 
          replace: 
            - _ #保留原始请求
            - 123.45.67.89 #ip镜像，需要ip HTTPS
            - 123.45.67.90:12345 #任意端口
            - [2606::1234]:34567 #ipv6
            - 1.2.3.4.nip.io:65121

        - search: \.(js|css)
          action: fetch
          fetch:
            status: 200
            engine: classic
            preflight: false
            timeout: 5000
            mode: cors
            redirect: follow
            credentials: include

        - search: _
          action: fetch
          fetch:
            status: 200
            engine: parallel
            preflight: true
            mode: cors
            redirect: follow
            credentials: include
            timeout: 5000
```

**主站和分流站需要HTTPS，ClientWorker在HTTP环境下不工作**

**此外，为了正确传递Ccookie等鉴权消息，`preflight`设为开，并且`credentials`为`include`，这意味着你的源站必须要开启`Access-Control-Allow-Origin`(不能为`*`，必须是当前域名)和`Access-Control-Allow-Credentials`为`true`，否则会直接失败**