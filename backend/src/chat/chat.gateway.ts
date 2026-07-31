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

/**
 * 客服 / 粉丝 共用一个网关,靠握手参数 role 区分。
 * 客服端:io(url, { query: { role:'cs', token } })
 * 粉丝端:io(url, { query: { role:'fan', openid, nickname } })
 */
@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chat: ChatService,
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

      // 接粉 + 建会话 + 自动欢迎语
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
          .emit('conversation:update', await this.chat.getConversationBrief(conv.id));
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

  /** 粉丝发消息 */
  @SubscribeMessage('fan:message')
  async onFanMessage(client: Socket, payload: { content: string }) {
    const { fanId } = client.data || {};
    if (!fanId || !payload?.content) return;
    const msg = await this.chat.fanSend(fanId, payload.content);
    this.server.to(`fan_${fanId}`).emit('message:new', msg);
    if (msg.csId) {
      this.server.to(`cs_${msg.csId}`).emit('message:new', msg);
      this.server
        .to(`cs_${msg.csId}`)
        .emit('conversation:update', await this.chat.getConversationBrief(msg.conversationId));
    }
  }

  /** 客服发消息 */
  @SubscribeMessage('cs:message')
  async onCsMessage(
    client: Socket,
    payload: { conversationId: number; content: string },
  ) {
    const { csId } = client.data || {};
    if (!csId || !payload?.conversationId || !payload?.content) return;
    const msg = await this.chat.csSend(csId, payload.conversationId, payload.content);
    this.server.to(`cs_${csId}`).emit('message:new', msg);
    this.server.to(`fan_${msg.fanId}`).emit('message:new', msg);
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
