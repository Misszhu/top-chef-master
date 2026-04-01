import app from './app';
import http from 'http';
import os from 'os';

const PORT = parseInt(String(process.env.PORT || '3000'), 10);

const server = http.createServer(app);

function isLanIPv4(family: os.NetworkInterfaceInfo['family']): boolean {
  return family === 'IPv4' || (family as unknown) === 4;
}

function logListenHints(): void {
  const nets = os.networkInterfaces();
  const addrs: string[] = [];
  for (const list of Object.values(nets)) {
    if (!list) continue;
    for (const net of list) {
      if (!net.internal && isLanIPv4(net.family)) {
        addrs.push(net.address);
      }
    }
  }
  console.log(`\n[top-chef] 小程序 / 真机请使用「本机局域网 IP」，不要用错成别的设备 IP。`);
  console.log(`[top-chef] 当前本机 IPv4（任选其一配置到前端的 API 地址）：`);
  if (addrs.length === 0) {
    console.log('  (未检测到非回环 IPv4，请检查网络)');
  } else {
    for (const a of addrs) {
      console.log(`  http://${a}:${PORT}/api/v1`);
    }
  }
  console.log(
    `[top-chef] 自测: curl "http://127.0.0.1:${PORT}/api/v1/dishes?page=1&limit=1" 应返回 JSON；若工具里出现 502 而此处无访问日志，说明请求未打到本进程（多为 IP/端口或中间代理）。\n`
  );
}

// 监听所有网卡地址，确保局域网设备/开发者工具模拟器能访问
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on ${process.env.NODE_ENV || 'development'}, port ${PORT}, bind 0.0.0.0`);
  logListenHints();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any, promise: Promise<any>) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
