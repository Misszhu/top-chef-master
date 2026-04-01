import Taro from '@tarojs/taro'
import { getApiOrigin } from '../utils/api-origin'

/** 通用配图上传（步骤图等），返回可写入 `image_url` 的绝对地址 */
export function uploadRecipeImage(tempFilePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const token = Taro.getStorageSync('token')
    Taro.uploadFile({
      url: `${getApiOrigin()}/api/v1/uploads/image`,
      filePath: tempFilePath,
      name: 'file',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        try {
          const body = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
          if (res.statusCode >= 200 && res.statusCode < 300 && body && body.data && body.data.url) {
            resolve(String(body.data.url))
            return
          }
          const errMsg = body && body.error && body.error.message ? body.error.message : '上传失败'
          reject(Object.assign(new Error(errMsg), { response: { status: res.statusCode, data: body } }))
        } catch (e) {
          reject(e)
        }
      },
      fail: (err) => reject(err),
    })
  })
}
