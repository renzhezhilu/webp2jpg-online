<center>

![title](https://cdn.jsdelivr.net/gh/renzhezhilu/webp2jpg-online/cdn/og_image2.png)

<!-- from shields.io/ -->

![title](https://cdn.jsdelivr.net/gh/renzhezhilu/webp2jpg-online/cdn/badges/01.svg)
![title](https://cdn.jsdelivr.net/gh/renzhezhilu/webp2jpg-online/cdn/badges/02.svg)
![title](https://cdn.jsdelivr.net/gh/renzhezhilu/webp2jpg-online/cdn/badges/03.svg)

</center>

## webp2jpg-online 介绍

我常常需要把webp图片转成jpg格式，很多在线转化提供的功能都需要上传文件，不爽。有非上传的但是ui很难用，谷歌一番后了解到html5自带接口的canvas.toBlob有转换图片格式的功能，索性就自己搞这个webp2jpg-online。


![title](https://cdn.jsdelivr.net/gh/renzhezhilu/webp2jpg-online/cdn/format2.png)

在线图片格式转化器, 可将jpeg、jpg、png、gif、webp、svg、ico、bmp文件转化为jpeg、png、webp、ico、gif文件。无需上传文件，本地即可完成转换

Online picture format converter, can convert jpeg, jpg, png, gif, webp, svg, ico, bmp files into jpeg, png, webp, ico, gif files. No need to upload files, conversion can be done locally。

## 主要功能
    ✓ 无需上传，使用浏览器自身进行转换
    ✓ 批量转换输出webp、jpeg、png、8位png、gif动图、webp动图、base64
    ✓ 输出指定大小(webp、jpeg)
    ✓ 输出颜色数量(gif、png-8)
    ✓ 选项可自定增加或删除并持久化


## 在线地址
https://renzhezhilu.gitee.io/webp2jpg-online/ 国内访问较快

https://renzhezhilu.github.io/webp2jpg-online/


## demo

![demo](https://cdn.jsdelivr.net/gh/renzhezhilu/webp2jpg-online/cdn/v2_demo.gif)


## 计划
[ ] 抽离主要功能做成[img2img.js](https://github.com/renzhezhilu/img2img)模块 (未开始)


## 更新日志

### v2.1 2020-08-17
    新增功能-输出指定大小
    新增功能-颜色数量选项(gif、png-8)
    新增功能-自动宽度输出
    新增格式-8位png
    新增格式-base64
    修复-选项删除功能
    修复-多文件下载遗漏
    修复-压缩包文件非英数乱码
    修复-大写后缀不识别
    修复-强调提示不支持文件格式
    删除-ico格式输出(假的ico实际还是png)
### v2.0 2020-06-26
    使用vue重构
    支持gif动图转webp动图
    尺寸和画质可自定义
    选项数据持久化
    可开启图片追加模式
    可开启转换效果对比
    优化了UI
    支持多语言
    页面文件也变大了,初次打开会比较慢，第二次之后就快了
### [v1.0](https://github.com/renzhezhilu/webp2jpg-online/tree/v1.0) 2020-01-14
    项目建立
    支持jpeg、webp、png互转
    可选输出宽度
    可选输出画质
    可批量处理



### 平台支持情况

||谷歌Chrome|火狐Firefox|苹果Safari|微软Edge|IE|
|---|-----|----|----|-----|---|
|Windows|✔️|✔️|-|✔️| ❌ 蛤？|
|Mac OS|✔️|✔️|☑️|✔️|-|
|Iphone|☑️|☑️| ✔️ | - |-|
|Android|?|?|?| -|-|
️️
> ✔️ 运行良好 ☑️ 部分支持 ❌ 不支持 ? 未测试

## ❤️感谢推荐
[科技爱好者周刊（第 114 期）：U 盘化生存和 Uber-job](http://www.ruanyifeng.com/blog/2020/07/weekly-issue-114.html)



## 图片格式转换的核心原理
### Canvas API

[HTMLCanvasElement.toBlob()](https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLCanvasElement/toBlob)

<!-- https://codepen.io/random233/pen/PowBBaa?editors=1000 -->
``` javascript
canvas.toBlob(callback, type, encoderOptions);
```
### WebAssembly
[MDN:WebAssembly doc](https://developer.mozilla.org/zh-CN/docs/WebAssembly)

[wasm-im ](https://github.com/mk33mk333/wasm-im)

[文章：WebAssembly实战-在浏览器中使用ImageMagick](https://cloud.tencent.com/developer/article/1554176) 
 _[(快照)](https://renzhezhilu.github.io/webp2jpg-online/doc/WebAssembly实战-在浏览器中使用ImageMagick.html)

## 依赖
[vue](https://github.com/vuejs/vue#readme)

[vue-clipboard2](https://github.com/Inndy/vue-clipboard2#readme) 文本复制

[vue-i18n](https://github.com/kazupon/vue-i18n#readme) 多语言
