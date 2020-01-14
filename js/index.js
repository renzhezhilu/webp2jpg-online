let allOkFiles = [],
    alltType = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.bmp'],
    outType = ['.jpeg', '.png', '.webp']




let input = document.getElementById("files")
input.addEventListener('change', readFiles, false);
//
async function readFiles() {
    document.getElementById('loading').style.display = 'block'
    let files = [...this.files]
    allOkFiles = []
    files.map(async (file, index) => {
        let base64 = await file2Base64(file)
        let wAndH = await getImagesWidthHeight(base64)
        let name = () => {
            let n = alltType.filter(f => file.name.endsWith(f))
            return {
                name: file.name.replace(n[0], ''),
                type: n[0].substr(1)
            }
        }
        // 
        let blob = await base642file(base64, outType[0])
        allOkFiles.push({
            name: name().name,
            type: name().type,
            base64: base64,
            size: file.size,
            width: wAndH.w,
            height: wAndH.h,
            data: blob
        })
        if (files.length - 1 === index) {
            console.log(allOkFiles)
            //下载
            let zip = new JSZip()
            let time = new Date().getTime()
            let img = zip.folder(time);
            allOkFiles.map(x => {
                img.file(`${x.name}${outType[0]}`, x.data, {
                    base64: false
                })
            })
            zip.generateAsync({
                    type: "blob"
                })
                .then(function(content) {
                    funDownload(content, `${time}.zip`)
                });
            // 显示图片
            let img_box = document.getElementById("img_box")
            let img_html = ``
            allOkFiles.map(x => {
                img_html = img_html +
                    `<div class="img_one">
                        <i class="type ${x.type}">${x.type}</i>
                        <p class="size">${x.width}x${x.height}</p>
                        <img src="${x.base64}" alt="">
                    </div>`
            })
            img_box.innerHTML = img_html
            document.getElementById('loading').style.display = 'none'

        }
    })
}
// 生成base64
function file2Base64(file) {
    return new Promise((ret, res) => {
        let reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = function(e) {
            console.log(e);
            ret(this.result)
        }
    })
}
// 获取图片的宽和高
function getImagesWidthHeight(base64) {
    return new Promise((ret, res) => {
        let img = new Image()
        img.src = base64
        img.onload = function() {
            ret({
                w: this.width,
                h: this.height
            })
        }
    })

}
// base64还原成图片  type = 'jpeg/png/webp'  size 尺寸   quality 压缩质量
function base642file(base64, type = 'jpeg', size = 1, quality = 1) {
    return new Promise((ret, res) => {
        let img = new Image()
        img.src = base64
        img.onload = function() {
            let _canvas = document.getElementById("can")
            //处理缩放
            let w = this.width * size
            let h = this.height * size
            _canvas.setAttribute("width", w)
            _canvas.setAttribute("height", h)
            _canvas.getContext("2d").drawImage(this, 0, 0, w, h)
            //转格式
            // let base64_ok = _canvas.toDataURL(`image/${type}`, quality)
            _canvas.toBlob(function(blob) {
                ret(blob)
            }, `image/${type}`, quality)
        }
    })
}

//下载文件
function funDownload(content, filename = '未命名') {
    let eleLink = document.createElement('a')
    eleLink.download = filename
    eleLink.style.display = 'none'
    // 字符内容转变成blob地址
    let blob = new Blob([content])
    eleLink.href = URL.createObjectURL(content)
    // 触发点击
    document.body.appendChild(eleLink)
    eleLink.click()
    // 然后移除
    document.body.removeChild(eleLink)
    // location.reload() 
}