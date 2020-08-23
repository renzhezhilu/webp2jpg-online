> The document uses Google Translate
<center>

![title](https://cdn.jsdelivr.net/gh/renzhezhilu/webp2jpg-online/cdn/og_image2.png)

![title](https://cdn.jsdelivr.net/gh/renzhezhilu/webp2jpg-online/cdn/badges/01.svg)
![title](https://cdn.jsdelivr.net/gh/renzhezhilu/webp2jpg-online/cdn/badges/02.svg)
![title](https://cdn.jsdelivr.net/gh/renzhezhilu/webp2jpg-online/cdn/badges/03.svg)
</center>


![title](https://cdn.jsdelivr.net/gh/renzhezhilu/webp2jpg-online/cdn/page_ui_en.jpg)
Introduction to webp2jpg-online
I often need to convert webp images to jpg format, and many of the functions provided by online conversion require uploading files, which sucks. There are non-uploads but the UI is difficult to use, Google later learned that html5 comes with a built-in interface called canvas. toBlob has the ability to convert images, so just do your own webp2jpg-online.

![title](https://cdn.jsdelivr.net/gh/renzhezhilu/webp2jpg-online/cdn/format2.png)
Online image format converter, jpeg, jpg, PNG, Gif, webp, svg, ICO, bmp files into Jpeg, PNG, webp, ICO, gif files. The conversion can be done locally without uploading the file
Online picture format converter, can convert jpeg, jpg, png, gif, webp, svg, ico, bmp files into jpeg, png, webp, ico, gif files. No need to upload files, conversion can be done locally。

## Main function
    No UPLOADS, conversion using the browser itself
    Batch translation outputs webp, jpeg, PNG, 8-bit PNG, gif animation, webp animation, base64
    Output specified size (WEBP, jpeg)
    Output number of colors (Gif, png-8)
    Options can customize adding or removing a tick and persisting it

## Online address
https://renzhezhilu.github.io/webp2jpg-online/

## demo
![demo](https://cdn.jsdelivr.net/gh/renzhezhilu/webp2jpg-online/cdn/v2_demo.gif)

# plan # 
[ ] Pull out the main function to make [img2img.js](https://github.com/renzhezhilu/img2img ) module (not started)

# # update the log
### v2.1 2020-08-17
    New feature-output specified size
    NEW FEATURE-COLOR COUNT OPTION (GIF, png-8)
    New feature-automatic width output
    New format-8-bit PNG
    New format-base64
    Fix-option delete function
    Fix-multi-file download omission
    Fix-compressed package file non-english garbled code
    Fix-capital suffix not recognized
    Fix-highlights that the prompt does not support file format
    Delete the-ico output (false ICO is still PNG) 
### v2.0 2020-06-26
    Refactoring using vue
    Support GIF GIF TO WEBP GIF
    The size and picture quality can be customized
    Option data persistence
    Enable image append mode
    Openable conversion comparison
    Optimized the UI
    Support for multiple languages
    The page file is also bigger, which is slower to open the first time and faster after the second time
### [v1.0](https://github.com/renzhezhilu/webp2jpg-online/tree/v1.0) 2020-01-14
    Project Establishment
    Support for Jpeg, webp, PNG conversion
    Optional output width
    Optional output picture quality
    Batch processing

Platform support
| | Google Chrome | Firefox | Apple Safari | Microsoft Edge | IE | 
|---|-----|----|----|-----|---|
| Windows ️| ☑️ | ☑️ | - | ☑️ |-
|Mac OS|✔️|✔️|☑️|✔️|-|
|Iphone|☑️|☑️| ✔️ | - |-|
|Android|☑️|☑️|-| -|-|
️️
> Something is running well? Untested
## ❤ thanks for the recommendation
[ tech enthusiast weekly (issue 114) : USB Survival and Uber-job ](http://www.ruanyifeng.com/blog/2020/07/weekly-issue-114.html )

## The core principle of image format conversion
### Canvas API
[HTMLCanvasElement.toBlob()](https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLCanvasElement/toBlob)

``` javascript
canvas.toBlob(callback, type, encoderOptions);
```
### WebAssembly
[MDN:WebAssembly doc](https://developer.mozilla.org/zh-CN/docs/WebAssembly)

[wasm-im ](https://github.com/mk33mk333/wasm-im)

[ article: Web Assembly practice-using Imagemagick in a browser ](https://cloud.tencent.com/developer/article/1554176)

[(snapshot)](https://renzhezhilu.github.io/webp2jpg-online/doc/webassembly-using)
