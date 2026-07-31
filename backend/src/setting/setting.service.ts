import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULTS: Record<string, string> = {
  systemName: '月亮通讯',
  welcomeMsg: '您好,欢迎咨询!请问有什么可以帮您?',
  assignStrategy: 'least', // least 最少会话 | round 轮询 | random 随机
  maxPerCs: '0', // 每客服最大接待数,0 = 不限
};

const ALLOWED = Object.keys(DEFAULTS);

@Injectable()
export class SettingService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<Record<string, string>> {
    const rows = await this.prisma.setting.findMany().catch(() => []);
    const map: Record<string, string> = { ...DEFAULTS };
    for (const r of rows) map[r.key] = r.value;
    return map;
  }

  async get(key: string): Promise<string> {
    const row = await this.prisma.setting
      .findUnique({ where: { key } })
      .catch(() => null);
    return row?.value ?? DEFAULTS[key] ?? '';
  }

  async setMany(obj: Record<string, unknown>) {
    for (const key of ALLOWED) {
      if (obj[key] !== undefined) {
        const value = String(obj[key]);
        await this.prisma.setting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        });
      }
    }
    return this.getAll();
  }

  // ===== 快捷回复 / 消息模板 =====
  listReplies() {
    return this.prisma.quickReply.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
    });
  }
  createReply(content: string) {
    return this.prisma.quickReply.create({ data: { content } });
  }
  updateReply(id: number, content: string) {
    return this.prisma.quickReply.update({ where: { id }, data: { content } });
  }
  async deleteReply(id: number) {
    await this.prisma.quickReply.delete({ where: { id } });
    return { success: true };
  }
}
