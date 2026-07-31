import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { WechatService } from './wechat.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chat: ChatService,
    private readonly wechat: WechatService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    const q = client.handshake.query;
    const role = q.role as string;

    if (role === 'cs') {
      const token = q.token as string;
      try {
        const payload = this.jwt.verify(token, {
          secret: this.config.get<string>('JWT_SECRET', 'yueliang-dev-secret'),
        });
        client.data = { role: 'cs', csId: payload.sub };
        client.join(`cs_${payload.sub}`);
        await this.chat.setCsOnline(payload.sub, true);
        this.logger.log(`客服 #${payload.sub} 已上线`);
      } catch {
        client.disconnect();
      }
      return;
    }

    if (role === 'fan') {
      const openid = (q.openid as string) || `demo_${client.id}`;
      const nickname = (q.nickname as string) || '匿名粉丝';
      const miniappId = q.miniappId ? Number(q.miniappId) : undefined;
      const fan = await this.chat.ensureFan(openid, nickname, miniappId);
      client.data = { role: 'fan', fanId: fan.id };
      client.join(`fan_${fan.id}`);
      await this.chat.setFanOnline(fan.id, true);

      const conv = await this.chat.assignAndEnsureConversation(fan.id);
      await this.chat.ensureWelcome(conv.id, conv.csId);
      const history = await this.chat.getMessages(conv.id);
      client.emit('fan:ready', {
        fanId: fan.id,
        nickname: fan.nickname,
        conversationId: conv.id,
        csId: conv.csId,
        history,
      });
      if (conv.csId) {
        this.server
          .to(`cs_${conv.csId}`)
          .emit(
            'conversation:update',
            await this.chat.getConversationBrief(conv.id),
          );
      }
      this.logger.log(`粉丝 #${fan.id}(${nickname})已上线,会话 #${conv.id}`);
      return;
    }

    client.disconnect();
  }

  async handleDisconnect(client: Socket) {
    const data = client.data;
    if (data?.role === 'cs') {
      await this.chat.setCsOnline(data.csId, false);
    } else if (data?.role === 'fan') {
      await this.chat.setFanOnline(data.fanId, false);
    }
  }

  /** 把新消息推给相关房间。微信渠道来的消息也走这里(fan 房间没人时无害)。 */
  async emitMessageToRooms(msg: any) {
    if (msg.fanId) this.server.to(`fan_${msg.fanId}`).emit('message:new', msg);
    if (msg.csId) {
      this.server.to(`cs_${msg.csId}`).emit('message:new', msg);
      this.server
        .to(`cs_${msg.csId}`)
        .emit(
          'conversation:update',
          await this.chat.getConversationBrief(msg.conversationId),
        );
    }
  }

  /** 粉丝(socket 端)发消息 */
  @SubscribeMessage('fan:message')
  async onFanMessage(client: Socket, payload: { content: string }) {
    const { fanId } = client.data || {};
    if (!fanId || !payload?.content) return;
    const msg = await this.chat.fanSend(fanId, payload.content);
    await this.emitMessageToRooms(msg);
  }

  /** 客服发消息 */
  @SubscribeMessage('cs:message')
  async onCsMessage(
    client: Socket,
    payload: { conversationId: number; content: string },
  ) {
    const { csId } = client.data || {};
    if (!csId || !payload?.conversationId || !payload?.content) return;
    const msg = await this.chat.csSend(
      csId,
      payload.conversationId,
      payload.content,
    );
    this.server.to(`cs_${csId}`).emit('message:new', msg);
    this.server.to(`fan_${msg.fanId}`).emit('message:new', msg);

    // 若粉丝来自微信,则通过客服消息接口下发(无真机凭据时自动跳过)
    const fan = await this.chat.getFan(msg.fanId);
    if (fan?.miniappId && fan.openid) {
      await this.wechat.sendCustomMessage(
        fan.miniappId,
        fan.openid,
        payload.content,
      );
    }
  }

  /** 客服标记会话已读 */
  @SubscribeMessage('cs:read')
  async onCsRead(client: Socket, payload: { conversationId: number }) {
    if (!payload?.conversationId) return;
    await this.chat.markRead(payload.conversationId);
    client.emit(
      'conversation:update',
      await this.chat.getConversationBrief(payload.conversationId),
    );
  }
}
