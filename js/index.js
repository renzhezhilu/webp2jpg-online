let allOkFiles = [],
    alltType = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp', 'vnd.microsoft.icon'],
    outType = ['jpeg', 'png', 'webp', 'ico'],
    config = {}

let input = document.getElementById("files")
input.addEventListener('change', function() {
    readFiles([...this.files])
}, false)
// 读取并转换图片,全部放进allOkFiles
async function readFiles(allFiles) {
    let files = [...allFiles]
    if (files.length === 0) return
    document.getElementById('loading').style.display = 'block'
    setConfig()
    allOkFiles = []
    files.map(async (file, index) => {
        //获取base64
        let base64 = await file2Base64(file)
        //获取宽和高
        let wAndH = await getImagesWidthHeight(base64)
        let name = () => {
            let n = alltType.filter(f => file.name.endsWith(f))
            return {
                name: file.name.replace(n[0], ''),
                type: n[0]
            }
        }
        // 转换
        let blob = await base642file(base64, config.type, config.size, config.quality)
        allOkFiles.push({
            name: name().name,
            type: name().type,
            base64: base64,
            size: file.size,
            width: wAndH.w,
            height: wAndH.h,
            data: blob
        })
        //遍历完所有文件后
        if (files.length === allOkFiles.length) {
            console.log(allOkFiles)
            //不打包
            if (config.isZip) {
                allOkFiles.map(x => {
                    funDownload(x.data, `${x.name}.${config.type}`)
                })
                document.getElementById('loading').style.display = 'none'
                document.getElementById('pyro').innerHTML =
                    `
                    <div class="before"></div>
                    <div class="after"></div>
                    `
            }
            //打包
            else {
                let zip = new JSZip()
                let time = new Date().getTime()
                let img = zip.folder(time)
                allOkFiles.map(x => {
                    img.file(`${x.name}.${config.type}`, x.data, {
                        base64: false
                    })
                })
                zip.generateAsync({
                        type: "blob"
                    })
                    .then(function(content) {
                        funDownload(content, `${time}.zip`)
                        document.getElementById('loading').style.display = 'none'
                        document.getElementById('pyro').innerHTML =
                            `
                            <div class="before"></div>
                            <div class="after"></div>
                            `
                    })
            }
            // 显示图片
            let img_box = document.getElementById("img_box")
            let img_html = ``
            allOkFiles.map(x => {
                img_html = img_html +
                    `<div class="img_one">
                        <p class="type ${x.type}">${x.type}</p>
                        <p class="size">${x.width}x${x.height}</p>
                        <img src="${x.base64}" alt="">
                    </div>`
            })
            img_box.innerHTML = img_html
        }
    })
}
// 获取参数
function setConfig() {
    config.type = document.querySelector('#select_type').value
    config.size = document.querySelector('#select_size').value - 0
    config.quality = document.querySelector('#select_quality').value - 0
    config.isZip = document.querySelector('#select_isZip').checked
    console.log(config)
}
// 生成base64
function file2Base64(file) {
    return new Promise((ret, res) => {
        let reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = function(e) {
            console.log(e)
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
function base642file(base64, type = 'jpeg', size = 1, quality = 0.92) {
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

// 设置拖放文件
function dropzone() {
    let holder = document.getElementById('body')
    //拖住，重复执行
    holder.ondragover = function(event) {
        // console.log(event)
        let close = setTimeout(() => {
            holder.className = ''
        }, 3000)
        if (holder.className !== 'ondragover') {
            holder.className = 'ondragover'
        } else {
            clearTimeout(close)
        }
        return false
    }
    holder.ondragend = function(event) {
        holder.className = ''
        console.log('ondragend')
        return false
    }
    // 放下
    holder.ondrop = function(event) {
        event.preventDefault()
        holder.className = ''
        let files = [...event.dataTransfer.files]
        //过滤文件
        files = files.filter(f => alltType.includes(f.type.split('/')[1]))
        // console.log(files)
        readFiles(files)
    }
}
dropzone()