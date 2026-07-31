import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { WechatService } from './wechat.service';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';

/**
 * 微信客服消息回调。真机时在小程序后台「消息推送」里填:
 *   URL   = http://<你的服务器>/api/wechat/callback/<AppID>
 *   Token = 后台里给这个小程序配的 Token
 *   数据格式 = JSON,加密方式 = 明文
 */
@Controller('wechat/callback')
export class WechatController {
  constructor(
    private readonly wechat: WechatService,
    private readonly chat: ChatService,
    private readonly gateway: ChatGateway,
  ) {}

  /** 微信服务器验证:签名对则原样返回 echostr */
  @Get(':appid')
  async verify(
    @Param('appid') appid: string,
    @Query('signature') signature: string,
    @Query('timestamp') timestamp: string,
    @Query('nonce') nonce: string,
    @Query('echostr') echostr: string,
  ): Promise<string> {
    const miniapp = await this.wechat.findByAppid(appid);
    if (
      miniapp?.token &&
      this.wechat.verifySignature(miniapp.token, signature, timestamp, nonce)
    ) {
      return echostr;
    }
    return 'fail';
  }

  /** 接收客服消息推送 → 路由进工作台 */
  @Post(':appid')
  @HttpCode(200)
  async receive(
    @Param('appid') appid: string,
    @Query('signature') signature: string,
    @Query('timestamp') timestamp: string,
    @Query('nonce') nonce: string,
    @Body() body: any,
  ): Promise<string> {
    const miniapp = await this.wechat.findByAppid(appid);
    if (!miniapp) return 'success';

    // 明文模式:有 Token 且带签名时校验;不通过则忽略(仍回 success 避免微信重推)
    if (
      miniapp.token &&
      signature &&
      !this.wechat.verifySignature(miniapp.token, signature, timestamp, nonce)
    ) {
      return 'success';
    }

    const parsed = this.wechat.parseIncoming(body);
    if (parsed && parsed.msgType === 'text' && parsed.content) {
      const nickname = `微信用户_${parsed.openid.slice(-4)}`;
      const msg = await this.chat.handleExternalFanMessage(
        parsed.openid,
        nickname,
        miniapp.id,
        parsed.content,
      );
      await this.gateway.emitMessageToRooms(msg);
    }
    // 微信要求返回 "success"
    return 'success';
  }
}
