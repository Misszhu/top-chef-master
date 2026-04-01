import type { CorsOptions } from 'cors';

/**
 * CORS_ORIGINS：逗号分隔的完整 Origin（含协议与端口），例如
 * https://your-h5-domain.com,http://localhost:10086
 *
 * - 无 Origin 的请求（微信小程序 wx.request、curl 等）默认放行。
 * - 开发环境且未配置 CORS_ORIGINS 时，使用内置本地默认列表（Taro/H5 常见端口）。
 * - 生产环境且请求携带 Origin：必须在白名单内，否则拒绝（不返回 Access-Control-Allow-Origin）。
 */
const DEV_DEFAULT_ORIGINS = [
  'http://localhost:10086',
  'http://127.0.0.1:10086',
  'http://localhost:9527',
  'http://127.0.0.1:9527',
];

function parseOriginsList(): string[] {
  const raw = process.env.CORS_ORIGINS;
  if (!raw || !raw.trim()) {
    return [];
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function buildCorsOptions(): CorsOptions {
  const configured = parseOriginsList();
  const isDev = process.env.NODE_ENV !== 'production';

  return {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const allowed =
        configured.length > 0 ? configured : isDev ? DEV_DEFAULT_ORIGINS : [];

      if (allowed.length === 0) {
        console.warn(
          '[cors] 生产环境未配置 CORS_ORIGINS，已拒绝带 Origin 的请求:',
          origin
        );
        callback(null, false);
        return;
      }

      if (allowed.includes(origin)) {
        callback(null, true);
        return;
      }

      if (isDev) {
        console.warn('[cors] Origin 不在白名单:', origin, '允许列表:', allowed);
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  };
}
