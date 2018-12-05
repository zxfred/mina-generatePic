/**
 * Author: Fred Zhang
 * 小程序版本要求: 1.6.0 以上 
 * 
 * 各API版本限制:
 * CanvasContext.clip() 1.6.0
 * canvasContext.setTextBaseline 1.4.0
 * wx.saveImageToPhotosAlbum 1.2.0
 */

let app = getApp();//小程序对象

class generatePicPannel {
    constructor({
        $this = null
    }) {
        this.$this = $this; // page对象
        this.canvasId = '' // 小程序 canvasId
        this.imgs = [] // 图片数组
    }

    /**
     * 初始化
     * @param initObj 初始化数据
     */
    init(initObj) {
        let that = this.$this
        this.canvasId = initObj.canvasData.canvasId
        this.imgs = initObj.imgArr
        this.txts = initObj.textArr
        // 指定 canvas 的宽高
        that.setData({
            canvasHidden: false,
            canvasH: initObj.canvasData.canvasH,
            canvasW: initObj.canvasData.canvasW
        })
        this.preLoadAllImg(initObj.imgArr)
    }

    /**
     * 预加载所有图片资源
     * @param arr 图片数组
     */
    drawPic() {
        // 获取绘图环境 context
        let ctx = wx.createCanvasContext(this.canvasId)

        // 绘制图片
        for (let img of this.imgs) {
            let [x, y] = img.pos
            let [w, h] = img.size
            // 绘图
            ctx.save()
            if (img.shadow) {
                ctx.setShadow(img.shadow.offsetX, img.shadow.offsetY, img.shadow.blur, img.shadow.color)
            }
            if (img.round) {
                ctx.beginPath()
                ctx.arc(x + w / 2, y + w / 2, w / 2, 0, 2 * Math.PI)
                ctx.clip()
            }
            ctx.drawImage(img.url, x, y, w, h)
            ctx.restore()            
        }

        // 绘制文字
        for (let txt of this.txts) {
            let [x, y] = txt.pos          
            this.drawText(ctx, txt.content, x, y, txt.contentWidth, txt.fontSize, txt.color, txt.maxLineCount)
        }

        // 在 draw() 回调里调用生成图片方法才能保证图片导出成功
        ctx.draw(true, () => {
            this.generatePicUrl()
        })

    }
    
    /**
     * 生成长图的url
     */
    generatePicUrl() {
        wx.canvasToTempFilePath({
            canvasId: this.canvasId,
            quality: 1, // 图片质量 0-1, 1为最大
            destWidth: 750,
            destHeight: 1266,
            success: res => {
                console.log(res)
                this.tempPicUrl = res.tempFilePath
                // this.savePic()
            },
            fail: err => {
                console.log(err)
            }
        })
    }

    /**
     * 保存生成的长图到手机
     */
    savePic() {
        let that = this.$this
        wx.saveImageToPhotosAlbum({
            filePath: this.tempPicUrl,
            success: (res) => {
                // console.log(res)
                that.showToast({
                    content: '保存成功'
                })
            },
            fail: (err) => {
                console.log(err)
            }
        })
    }

    /**
     * 预加载所有图片资源
     * @param arr 图片数组
     */
    preLoadAllImg(arr) {
        wx.showLoading({
            title: '加载中'
        })
        let promiseArr = arr.map((v) => {
            return this.preLoadImg(v.url)
        })
        Promise.all(promiseArr)
        .then(res => {
            this.imgs.map((v, i) => {
                v.url = res[i]
            })
            wx.hideLoading()               
        })
        .catch(err => {
            console.log(err)
            wx.hideLoading()   
        })
    }

    /**
     * 预加载单个图片资源, 用于 canvas 绘图
     * @param url 图片地址
     */
    preLoadImg(url) {
        return new Promise((resolve, reject) => {
            wx.getImageInfo({
                src: url,
                success: (res) => {
                    resolve(res.path)
                },
                fail: (res) => {
                    reject()
                }
            })
        })
    }

    /**
     * 绘制多行文本
     * @param ctx canvas context
     * @param str 文字内容
     * @param x 文字区域 x 坐标
     * @param y 文字区域 y 坐标
     * @param contentWidth 文字区域宽度
     * @param fontSize 字号
     * @param maxLineCount 最大行数限制, 不传则无限制
     */
    drawText(ctx, str, x, y, contentWidth, fontSize, color, maxLineCount) {
        ctx.save()
        ctx.setFontSize(fontSize)
        ctx.setFillStyle(color)
        ctx.setTextBaseline('top')
        let charInLine = (contentWidth * 2 / fontSize) - 3 // 每行有多少字符长度
        let len = 0 // 每行的长度, 换行后重置
        let s = '' // 拼接的字符串
        let line = 0 // 行数
        let random = Math.random().toString(36).substr(2) // 分割符

        for (let i = 0; i < str.length; i++) {
            // 累加每个字符长度, 英文1个字符, 中文2个字符
            (str.charCodeAt(i) > 127 || str.charCodeAt(i) == 94) ? len += 2 : len ++
            s = s + str[i]
            if (len >= charInLine) {
                s = s + random
                line = line + 1
                len = 0
            }
        }
        let lineArr = s.split(random)

        // 限制行数
        if (maxLineCount && line >= maxLineCount) {
            lineArr = lineArr.slice(0, maxLineCount)
            // console.log(lineArr[lineArr.length - 1].slice)
            lineArr[lineArr.length - 1] = lineArr[lineArr.length - 1].slice(0, -1) + '...'
        }

        // 绘制文字
        lineArr.forEach((v, i) => {
            ctx.fillText(v, x, y + 26 * i) 
        })

        ctx.restore()        
    }
}

export default generatePicPannel
