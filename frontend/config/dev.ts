import type { UserConfigExport } from "@tarojs/cli"

export default {
   logger: {
    quiet: false,
    stats: true
  },
  defineConstants: {
    // 开发联调：使用本机局域网 IP，避免小程序不允许访问 localhost
    API_BASE_URL: JSON.stringify('http://192.168.31.31:3000/api/v1'),
  },
  mini: {},
  h5: {}
} satisfies UserConfigExport<'webpack5'>
