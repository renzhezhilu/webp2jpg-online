> ドキュメントはGoogle翻訳を使用しています
<center>

![title](https://cdn.jsdelivr.net/gh/renzhezhilu/webp2jpg-online/cdn/og_image2.png)

![title](https://cdn.jsdelivr.net/gh/renzhezhilu/webp2jpg-online/cdn/badges/01.svg)
![title](https://cdn.jsdelivr.net/gh/renzhezhilu/webp2jpg-online/cdn/badges/02.svg)
![title](https://cdn.jsdelivr.net/gh/renzhezhilu/webp2jpg-online/cdn/badges/03.svg)
</center>

## webp2jpg-onlineの概要


![title](https://cdn.jsdelivr.net/gh/renzhezhilu/webp2jpg-online/cdn/page_ui_jp.jpg)

>私はしばしばwebp画像をjpg形式に変換する必要があり、オンライン変換によって提供される機能の多くはファイルのアップロードを必要とします。これは面倒です。アップロードはありませんが、UIは使いづらく、Googleは後でhtml5に組み込みcanvasと呼ばれるインターフェースでtoBlobは画像を変換する機能を備えているので、独自のwebp2jpg-onlineを実行するだけです。



オンライン画像形式コンバーター、jpeg、jpg、PNG、Gif、webp、svg、ICO、bmpファイルをJpeg、PNG、webp、ICO、gifファイルに変換します。ファイルをアップロードせずにローカルで変換できます
オンライン画像形式コンバーターは、jpeg、jpg、png、gif、webp、svg、ico、bmpファイルをjpeg、png、webp、ico、gifファイルに変換できます。ファイルをアップロードする必要はなく、変換はローカルで実行できます。

## 主な機能

    アップロードなし、ブラウザ自体を使用した変換
    バッチ変換は、webp、jpeg、PNG、8ビットPNG、gifアニメーション、webpアニメーション、base64を出力します
    出力指定サイズ(WEBP、jpeg)
    色の出力数(Gif、png-8)
    オプションは、ティックの追加または削除と永続化をカスタマイズできます

![title](https://cdn.jsdelivr.net/gh/renzhezhilu/webp2jpg-online/cdn/format2.png)

## オンラインアドレス
https://renzhezhilu.github.io/webp2jpg-online/

## デモ
![title](https://cdn.jsdelivr.net/gh/renzhezhilu/webp2jpg-online/cdn/v2_demo.gif)

## 予定
[] main関数を引き出して[img2img.js](https://github.com/renzhezhilu/img2img)モジュールを作成します(開始されていません)

## グを更新
### v2.1 2020-08-17
    新しい機能出力指定サイズ
    新しい機能カラー数オプション(GIF、png-8)
    新機能-自動幅出力
    新しい形式の8ビットPNG
    新しいformat-base64
    修正オプション削除機能
    複数ファイルのダウンロードの欠落を修正
    修正圧縮されたパッケージファイルの英語以外の文字化けしたコード
    大文字のサフィックスが認識されない
    プロンプトがファイル形式をサポートしていないことを修正ハイライト
    -ico出力を削除します(false ICOはPNGのままです)。
### v2.0 2020-06-26
    vueを使用したリファクタリング
    GIF GIFからWEBP GIFへのサポート
    サイズと画質をカスタマイズできます
    オプションデータの永続性
    画像追加モードを有効にする
    オープン可能な変換の比較
    UIを最適化
    複数言語のサポート
    ページファイルも大きいため、最初に開くのが遅く、2回目以降は速くなります
### [v1.0](https://github.com/renzhezhilu/webp2jpg-online/tree/v1.0)2020-01-14
    プロジェクト設立
    Jpeg、webp、PNG変換のサポート
    オプションの出力幅
    オプションの出力画質
    バッチ処理

プラットフォームサポート
| | Google Chrome | Firefox | Apple Safari | Microsoft Edge | IE |
| --- | ----- | ---- | ---- | ----- | --- |
| Windows️|☑️|☑️|-|☑️|-
| Mac OS |✔️|✔️|☑️|✔️|-|
| iPhone |☑️|☑️|✔️|-|-|
| Android |☑️|☑️|-|-|-|
️️
>正常に動作していますか？未テスト
##❤推奨に感謝
[技術愛好家、毎週(問題114)：USBサバイバルとUberジョブ](http://www.ruanyifeng.com/blog/2020/07/weekly-issue-114.html)

##画像フォーマット変換の中核原理
### Canvas API
[HTMLCanvasElement.toBlob()](https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLCanvasElement/toBlob)

`` `javascript
canvas.toBlob(callback、type、encoderOptions);
「」
### WebAssembly

[MDN：WebAssembly doc](https://developer.mozilla.org/zh-CN/docs/WebAssembly)

[wasm-im](https://github.com/mk33mk333/wasm-im)

[記事：Webアセンブリの実践-ブラウザーでImagemagickを使用する](https://cloud.tencent.com/developer/article/1554176)

[(スナップショット)](https://renzhezhilu.github.io/webp2jpg-online/doc/webassembly-using)