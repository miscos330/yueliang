import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 微信小程序对接(P6)。
 * 只依赖 Prisma,不反向依赖 chat,避免循环依赖。
 * 真机凭据(AppSecret/Token)填好后即可收发;当前无凭据时优雅降级(不报崩)。
 */
@Injectable()
export class WechatService {
  private readonly logger = new Logger(WechatService.name);

  constructor(private readonly prisma: PrismaService) {}

  findByAppid(appid: string) {
    return this.prisma.miniProgram.findUnique({ where: { appid } });
  }

  /** 微信服务器验证:sha1(sort(token,timestamp,nonce)) === signature */
  verifySignature(
    token: string,
    signature: string,
    timestamp: string,
    nonce: string,
  ): boolean {
    if (!token || !signature) return false;
    const raw = [token, timestamp || '', nonce || ''].sort().join('');
    const hash = createHash('sha1').update(raw).digest('hex');
    return hash === signature;
  }

  /** 解析小程序客服消息(JSON 明文模式) */
  parseIncoming(
    body: any,
  ): { openid: string; content: string; msgType: string } | null {
    if (!body) return null;
    const openid = body.FromUserName || body.fromusername;
    const msgType = body.MsgType || body.msgtype || 'text';
    const content = body.Content || body.content || '';
    if (!openid) return null;
    return { openid, content, msgType };
  }

  /** 获取并缓存 access_token(需真实 AppSecret) */
  async getAccessToken(miniapp: {
    id: number;
    appid: string;
    appSecret: string;
    accessToken: string | null;
    accessTokenExpire: Date | null;
  }): Promise<string | null> {
    if (
      miniapp.accessToken &&
      miniapp.accessTokenExpire &&
      miniapp.accessTokenExpire.getTime() > Date.now() + 60000
    ) {
      return miniapp.accessToken;
    }
    try {
      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${encodeURIComponent(
        miniapp.appid,
      )}&secret=${encodeURIComponent(miniapp.appSecret)}`;
      const res = await fetch(url);
      const data: any = await res.json();
      if (data.access_token) {
        const expire = new Date(Date.now() + (data.expires_in - 200) * 1000);
        await this.prisma.miniProgram.update({
          where: { id: miniapp.id },
          data: { accessToken: data.access_token, accessTokenExpire: expire },
        });
        return data.access_token;
      }
      this.logger.warn(
        `获取 access_token 失败(${miniapp.appid}): ${JSON.stringify(data)}`,
      );
      return null;
    } catch (e) {
      this.logger.warn(`获取 access_token 异常: ${(e as Error).message}`);
      return null;
    }
  }

  /** 下发客服消息给微信用户(需真实凭据;无凭据时返回 false 不报崩) */
  async sendCustomMessage(
    miniappId: number,
    openid: string,
    content: string,
  ): Promise<boolean> {
    const miniapp = await this.prisma.miniProgram.findUnique({
      where: { id: miniappId },
    });
    if (!miniapp || !miniapp.appSecret) return false;
    const token = await this.getAccessToken(miniapp);
    if (!token) return false;
    try {
      const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${token}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touser: openid,
          msgtype: 'text',
          text: { content },
        }),
      });
      const data: any = await res.json();
      if (data.errcode && data.errcode !== 0) {
        this.logger.warn(`客服消息下发失败: ${JSON.stringify(data)}`);
        return false;
      }
      return true;
    } catch (e) {
      this.logger.warn(`客服消息下发异常: ${(e as Error).message}`);
      return false;
    }
  }
}
