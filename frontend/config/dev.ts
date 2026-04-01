import type { UserConfigExport } from '@tarojs/cli'

/**
 * 小程序请求必须指向「运行 backend 的那台电脑」的局域网 IP。
 * 默认 IP 易过期：若微信里出现 502 且 Node 终端没有任何 GET 日志，多半是 IP 指到了别的设备。
 *
 * 覆盖方式（二选一）：
 * - 在本文件改默认常量，或
 * - 项目根目录建 `.env.development`，写：TARO_APP_API_BASE_URL=http://你的IP:3000/api/v1
 */
const fromEnv = process.env.TARO_APP_API_BASE_URL
const DEFAULT_API_BASE = 'http://192.168.31.31:3000/api/v1'
const apiBase = ((fromEnv && fromEnv.trim()) || DEFAULT_API_BASE).replace(/\/$/, '')

export default {
  logger: {
    quiet: false,
    stats: true,
  },
  defineConstants: {
    API_BASE_URL: JSON.stringify(apiBase),
  },
  mini: {},
  h5: {},
} satisfies UserConfigExport<'webpack5'>
