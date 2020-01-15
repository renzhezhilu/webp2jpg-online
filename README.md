<p align="center">

![title](./images/og_image.png)

<!-- from shields.io/ -->

![title](./images/badges/01.svg)
![title](./images/badges/02.svg)
![title](./images/badges/03.svg)

</p>

## webp2jpg-online 介绍

我常常需要把webp图片转成jpg格式，很多在线转化提供的功能都需要上传文件，不爽。有非上传的但是ui很难用，谷歌一番后了解到html5自带接口的canvas.toBlob有转换图片格式的功能，索性就自己搞这个webp2jpg-online。

> ⚠️ 目前只测试通过Chrome，其他浏览器不保证正常。

![title](./images/og_image02.png)

在线图片格式转化器, 可将jpeg、jpg、png、gif、webp、svg、ico、bmp文件转化为jpeg、png、webp、ico文件。无需上传文件，本地即可完成转换

Online picture format converter, can convert jpeg, jpg, png, gif, webp, svg, ico, bmp files into jpeg, png, webp, ico files. No need to upload files, conversion can be done locally。

## 在线地址

https://renzhezhilu.github.io/webp2jpg-online/

## demo

![demo](./images/demo.gif)

## 核心原理

[HTMLCanvasElement.toBlob()](https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLCanvasElement/toBlob)

``` javascript
canvas.toBlob(callback, type, encoderOptions);
```

