import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingService } from '../setting/setting.service';
import { JwtPayload } from '../auth/auth.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private rrIndex = -1; // 轮询游标

  constructor(
    private readonly prisma: PrismaService,
    private readonly setting: SettingService,
  ) {}

  // ===== 在线状态 =====
  async setCsOnline(csId: number, online: boolean) {
    await this.prisma.cs
      .update({ where: { id: csId }, data: { online } })
      .catch(() => null);
  }

  async setFanOnline(fanId: number, online: boolean) {
    await this.prisma.fan
      .update({
        where: { id: fanId },
        data: { online, lastActiveAt: new Date() },
      })
      .catch(() => null);
  }

  async ensureFan(openid: string, nickname: string, miniappId?: number) {
    const existing = await this.prisma.fan.findUnique({ where: { openid } });
    if (existing) return existing;
    return this.prisma.fan.create({
      data: { openid, nickname, miniappId: miniappId ?? null },
    });
  }

  // ===== 接粉分配:按设置的策略 =====
  async pickCs(): Promise<number | null> {
    const onlineCs = await this.prisma.cs.findMany({
      where: { role: 'cs', online: true, status: 1 },
    });
    if (onlineCs.length === 0) return null;

    const settings = await this.setting.getAll();
    const maxPerCs = Number(settings.maxPerCs) || 0;

    let candidates = await Promise.all(
      onlineCs.map(async (c) => ({
        id: c.id,
        count: await this.prisma.conversation.count({
          where: { csId: c.id, status: 1 },
        }),
      })),
    );
    // 满员过滤
    if (maxPerCs > 0) candidates = candidates.filter((c) => c.count < maxPerCs);
    if (candidates.length === 0) return null;

    const strategy = settings.assignStrategy || 'least';
    if (strategy === 'random') {
      return candidates[Math.floor(Math.random() * candidates.length)].id;
    }
    if (strategy === 'round') {
      this.rrIndex = (this.rrIndex + 1) % candidates.length;
      return candidates[this.rrIndex].id;
    }
    // least:最少会话优先
    candidates.sort((a, b) => a.count - b.count);
    return candidates[0].id;
  }

  async assignAndEnsureConversation(fanId: number) {
    const open = await this.prisma.conversation.findFirst({
      where: { fanId, status: 1 },
      orderBy: { createdAt: 'desc' },
    });
    if (open) return open;

    const csId = await this.pickCs();
    const conv = await this.prisma.conversation.create({
      data: { fanId, csId, status: 1 },
    });
    if (csId) {
      await this.prisma.fan.update({
        where: { id: fanId },
        data: { assignedCsId: csId },
      });
      await this.prisma.cs.update({
        where: { id: csId },
        data: { fansCount: { increment: 1 } },
      });
    }
    return conv;
  }

  /** 新会话且配置了欢迎语时,自动发一条欢迎消息 */
  async ensureWelcome(conversationId: number, csId: number | null) {
    const count = await this.prisma.message.count({ where: { conversationId } });
    if (count > 0) return null;
    const welcome = await this.setting.get('welcomeMsg');
    if (!welcome) return null;
    const msg = await this.prisma.message.create({
      data: {
        conversationId,
        fromType: 'cs',
        fromId: csId ?? undefined,
        content: welcome,
        type: 'text',
      },
    });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMsg: welcome, lastMsgAt: new Date() },
    });
    return msg;
  }

  // ===== 收发消息 =====
  async fanSend(fanId: number, content: string) {
    const conv = await this.assignAndEnsureConversation(fanId);
    const msg = await this.prisma.message.create({
      data: {
        conversationId: conv.id,
        fromType: 'fan',
        fromId: fanId,
        content,
        type: 'text',
      },
    });
    await this.prisma.conversation.update({
      where: { id: conv.id },
      data: { lastMsg: content, lastMsgAt: new Date(), unread: { increment: 1 } },
    });
    return { ...msg, csId: conv.csId, fanId };
  }

  /** 外部渠道(微信)来的粉丝消息:建/找粉丝 + 会话,存消息,返回用于推送的 msg */
  async handleExternalFanMessage(
    openid: string,
    nickname: string,
    miniappId: number,
    content: string,
  ) {
    const fan = await this.ensureFan(openid, nickname, miniappId);
    await this.setFanOnline(fan.id, true);
    return this.fanSend(fan.id, content);
  }

  /** 取粉丝(判断是否微信来源、下发客服消息用) */
  getFan(fanId: number) {
    return this.prisma.fan.findUnique({ where: { id: fanId } });
  }

  async csSend(csId: number, conversationId: number, content: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) throw new Error('会话不存在');
    const msg = await this.prisma.message.create({
      data: {
        conversationId,
        fromType: 'cs',
        fromId: csId,
        content,
        type: 'text',
      },
    });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMsg: content, lastMsgAt: new Date() },
    });
    return { ...msg, csId, fanId: conv.fanId };
  }

  async markRead(conversationId: number) {
    await this.prisma.message.updateMany({
      where: { conversationId, fromType: 'fan', read: false },
      data: { read: true },
    });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { unread: 0 },
    });
    return { success: true };
  }

  // ===== 查询 =====
  async getConversationBrief(conversationId: number) {
    const c = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { fan: true },
    });
    if (!c) return null;
    return {
      id: c.id,
      fanId: c.fanId,
      fanNickname: c.fan.nickname,
      fanAvatar: c.fan.avatar,
      fanOnline: c.fan.online,
      csId: c.csId,
      status: c.status,
      lastMsg: c.lastMsg,
      lastMsgAt: c.lastMsgAt,
      unread: c.unread,
    };
  }

  async listConversations(payload: JwtPayload) {
    const where =
      payload.role === 'admin'
        ? { status: 1 }
        : { csId: payload.sub, status: 1 };
    const rows = await this.prisma.conversation.findMany({
      where,
      include: { fan: true },
      orderBy: [{ lastMsgAt: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((c) => ({
      id: c.id,
      fanId: c.fanId,
      fanNickname: c.fan.nickname,
      fanAvatar: c.fan.avatar,
      fanOnline: c.fan.online,
      csId: c.csId,
      lastMsg: c.lastMsg,
      lastMsgAt: c.lastMsgAt,
      unread: c.unread,
    }));
  }

  async getMessages(conversationId: number) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
  }
}
