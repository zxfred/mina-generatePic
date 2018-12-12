const https = require('https')
var crypto = require('crypto')

class getOpenData {
    constructor(appId, secret, encryptedData, jscode, iv) {
        this.appId = appId,
        this.secret = secret,
        this.encryptedData = encryptedData,
        this.jscode = jscode,        
        this.iv = iv
    }

    getData() {
        https.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${this.appId}&secret=${this.secret}&js_code=${this.jscode}&grant_type=authorization_code`, (res) => {
            res.on('data', (d) => {
                let data                
                d = JSON.parse(d)
                if (d.session_key) {
                    let pc = new WXBizDataCrypt(this.appId, d.session_key)
                    data = pc.decryptData(this.encryptedData, this.iv)
                } else {
                    data = d
                }
                console.log(data)
                // DO SOMETHING
            })
        }).on('error', (e) => {
            console.error(e)
        })
    }
}

// 以下为微信示例代码
function WXBizDataCrypt(appId, sessionKey) {
    this.appId = appId
    this.sessionKey = sessionKey
}

WXBizDataCrypt.prototype.decryptData = function (encryptedData, iv) {
    // base64 decode
    var sessionKey = new Buffer(this.sessionKey, 'base64')
    encryptedData = new Buffer(encryptedData, 'base64')
    iv = new Buffer(iv, 'base64')

    try {
        // 解密
        var decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, iv)
        // 设置自动 padding 为 true，删除填充补位
        decipher.setAutoPadding(true)
        var decoded = decipher.update(encryptedData, 'binary', 'utf8')
        decoded += decipher.final('utf8')

        decoded = JSON.parse(decoded)

    } catch (err) {
        throw new Error('Illegal Buffer')
    }

    if (decoded.watermark.appid !== this.appId) {
        throw new Error('Illegal Buffer')
    }
    return decoded
}

// 固定参数
const APPID = 'wx7bb576902363f4ff'
const SECRET = 'a2920f1bf1b84fc6ec9ab062fc5e7b02'

// 调用 wx.login 获得
const jscode = '0011MDX01n4DVX1GkKW01P0DX011MDXH'

// 调用 wx.getShareInfo 获得
const encryptedData = 'DM2Z16FRYIHwtScwjR/RAaQW/SxjohFeSDN1mfEbcQKuGeH+pD4PBJtnYtJWemC1G9Mxz2rLRW56R2IMIgOrEpbKMnCVomJmrawUqlkGfRNbosvJsaUEIX3sN1U8t/xbVr79QRH3SfsRN3Q3Ey8bEQ=='
const iv = 'qiAFh0JyQ5/2ZTSR/1+MWw=='

// 调用
let getOpenDataPannel = new getOpenData(APPID, SECRET, encryptedData, jscode, iv)
getOpenDataPannel.getData()
