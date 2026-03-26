import app from './app';
import http from 'http';

const PORT = parseInt(String(process.env.PORT || '3000'), 10);

const server = http.createServer(app);

// 监听所有网卡地址，确保局域网设备/开发者工具模拟器能访问
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on ${process.env.NODE_ENV || 'development'}:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any, promise: Promise<any>) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
