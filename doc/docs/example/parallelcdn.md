# 并发CDN流量请求

`JSDelivr`、`Unpkg`、`cdnjs`等著名cdn在国内几乎没有官网加速，为了辅助国内用户请求，你可以不用修改原来的链接，直接用ClientWorker在前端并发国内镜像，从而实现全球级别的加速。

此处单方面宣布[`SouceGlobalCDN`](https://www.sourcegcdn.com/)为本项目官方提供商！请合理使用公益服务，维护更好的网络环境！

## `NPM`

NPM的镜像相对较少，如果有更多的推荐可以点击右上角Github图标提issue。

```yaml
- rule: ^https\:\/\/((cdn|fastly|gcore|test1|quantil)\.jsdelivr\.net\/npm|unpkg\.com)
  transform_rules:
    - search: _
      replace:
        - _
        - https://unpkg.zhimg.com #回源已关闭，原缓存有效
        - https://npm.elemecdn.com #2022/7/12 确认关闭回源，缓存有效
        - https://code.bdstatic.com/npm #确认关闭回源，缓存有效
        - https://npm.sourcegcdn.com #滥用封仓库，强制数字版本号
        - https://cdn.bilicdn.tk/npm # 由GamerNoTitle提供的反代，请勿滥用:D
```

作者也知道其它私人性质的公益cdn，但为了避免纠纷，非公开公益性质的cdn暂不收录。如果需要提交私人性质cdn，请征询cdn主人许可。

## `CDNJS`

`CDNJS`有着较为严格的审核，作为全球最热门的开源共享库，在国内还是有着丰富的镜像，如果有更多的推荐可以点击右上角Github图标提issue。

```yaml
- rule: ^https\:\/\/cdnjs\.cloudflare\.com\/ajax\/libs
  transform_rules:
    - search: _
      replace:
        - _
        - https://cdn.bootcdn.net/ajax/libs
        - https://lib.baomitu.com
        - https://mirrors.cqupt.edu.cn/cdnjs/ajax/libs # 重庆邮电
        - https://cdn.staticfile.org
        - https://mirrors.sustech.edu.cn/cdnjs/ajax/libs # 南大
        - https://cdnjs.sourcegcdn.com/ajax/libs # 全同步 https://cdnjs.cloudflare.com

```

## `Github`

Github镜像大多为私人性质的cdn，为了避免纠纷，非公开公益性质的cdn暂不收录。如果需要提交私人性质cdn，请征询cdn主人许可。
