import { userRepository } from '../repositories/user.repository';
import { generateToken } from '../utils/jwt';

export class AuthService {
  private async getWechatSession(code: string): Promise<{ openid: string; unionid?: string | null }> {
    const appid = process.env.WECHAT_APPID;
    const appsecret = process.env.WECHAT_APPSECRET;

    if (!appid || !appsecret) {
      // 这里抛错由上层统一转 500；生产环境建议换成更明确的错误码
      throw new Error('WECHAT_CONFIG_MISSING');
    }

    const url = new URL('https://api.weixin.qq.com/sns/jscode2session');
    url.searchParams.set('appid', appid);
    url.searchParams.set('secret', appsecret);
    url.searchParams.set('js_code', code);
    url.searchParams.set('grant_type', 'authorization_code');

    const resp = await fetch(url.toString());
    if (!resp.ok) {
      throw new Error(`WECHAT_JSCODE2SESSION_HTTP_${resp.status}`);
    }

    const data: any = await resp.json();
    // 微信错误返回：{ errcode, errmsg }
    if (data?.errcode) {
      throw new Error(`WECHAT_JSCODE2SESSION_ERR_${data.errcode}`);
    }

    const openid = data?.openid;
    if (!openid) {
      throw new Error('WECHAT_JSCODE2SESSION_NO_OPENID');
    }

    return { openid: String(openid), unionid: data?.unionid ? String(data.unionid) : null };
  }

  async wechatLogin(code: string) {
    const { openid, unionid } = await this.getWechatSession(code);
    
    let user = await userRepository.findByOpenId(openid);
    
    if (!user) {
      // Create new user if not exists
      user = await userRepository.create(openid, {
        nickname: `Chef_${code.slice(0, 4)}`,
        avatar_url: 'https://via.placeholder.com/150'
      }, unionid);
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
