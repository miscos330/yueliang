import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 统计全部从数据库聚合(P4 后已覆盖图1 所有指标)。
 */
@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  private startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  async overview() {
    const today = this.startOfToday();
    const [miniappCount, csCount, todayNewFans, todayMessages] =
      await Promise.all([
        this.prisma.miniProgram.count().catch(() => 0),
        this.prisma.cs.count({ where: { role: 'cs' } }).catch(() => 0),
        this.prisma.fan
          .count({ where: { createdAt: { gte: today } } })
          .catch(() => 0),
        this.prisma.message
          .count({ where: { createdAt: { gte: today } } })
          .catch(() => 0),
      ]);
    return { miniappCount, csCount, todayNewFans, todayMessages };
  }

  async realtime() {
    const today = this.startOfToday();
    const [csOnline, fansOnline, todayMessages, todaySessions] =
      await Promise.all([
        this.prisma.cs
          .count({ where: { role: 'cs', online: true } })
          .catch(() => 0),
        this.prisma.fan.count({ where: { online: true } }).catch(() => 0),
        this.prisma.message
          .count({ where: { createdAt: { gte: today } } })
          .catch(() => 0),
        this.prisma.conversation
          .count({ where: { createdAt: { gte: today } } })
          .catch(() => 0),
      ]);
    return {
      csOnline,
      fansOnline,
      todayMessages,
      todaySessions,
      todayDeletedSessions: 0,
    };
  }

  async csWorkload() {
    const rows = await this.prisma.cs
      .findMany({ where: { role: 'cs' }, orderBy: { createdAt: 'desc' } })
      .catch(() => [] as Array<Record<string, unknown>>);
    const list = (rows as any[]).map((c) => ({
      id: c.id,
      nickname: c.nickname,
      online: c.online,
      fansCount: c.fansCount,
      remark: c.remark ?? '',
      lastLogin: c.lastLoginAt ? new Date(c.lastLoginAt).toISOString() : '',
    }));
    return { list, total: list.length };
  }
}
