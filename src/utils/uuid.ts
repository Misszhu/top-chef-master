/**
 * UUID 生成工具
 */

export function generateUUID(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 32;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  // 格式化为 uuid 样式：8-4-4-4-12
  return `${result.substr(0, 8)}-${result.substr(8, 4)}-${result.substr(12, 4)}-${result.substr(16, 4)}-${result.substr(20)}`;
}
