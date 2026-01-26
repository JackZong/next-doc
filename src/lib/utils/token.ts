import { randomBytes } from 'crypto';

/**
 * 生成随机访问Token
 * @param length Token长度，默认12位
 * @returns 由大小写字母和数字组成的Token字符串
 */
export function generateAccessToken(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  // 使用crypto生成随机字节
  const bytes = randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    // 使用随机字节选择字符
    token += chars[bytes[i] % chars.length];
  }
  
  return token;
}

/**
 * 验证Token格式
 * @param token 要验证的Token
 * @returns 是否为有效的Token格式
 */
export function isValidToken(token: string): boolean {
  // Token应该是12位大小写字母和数字
  return /^[A-Za-z0-9]{12}$/.test(token);
}
