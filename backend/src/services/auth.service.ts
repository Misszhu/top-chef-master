import { userRepository } from '../repositories/user.repository';
import { generateToken } from '../utils/jwt';

export class AuthService {
  async wechatLogin(code: string) {
    // In a real application, we would call WeChat's API to get openid
    // For now, we simulate this with a mock openid
    const openid = `mock_openid_${code}`;
    
    let user = await userRepository.findByOpenId(openid);
    
    if (!user) {
      // Create new user if not exists
      user = await userRepository.create(openid, {
        nickname: `Chef_${code.slice(0, 4)}`,
        avatar_url: 'https://via.placeholder.com/150'
      });
    }
    
    const token = generateToken({ userId: String(user.id), openid: String(user.wechat_openid) });
    
    return {
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar_url: user.avatar_url
      }
    };
  }
}

export const authService = new AuthService();
