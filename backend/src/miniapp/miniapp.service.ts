import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMiniappDto } from './dto/create-miniapp.dto';
import { UpdateMiniappDto } from './dto/update-miniapp.dto';
import { QueryMiniappDto } from './dto/query-miniapp.dto';

@Injectable()
export class MiniappService {
  constructor(private readonly prisma: PrismaService) {}

  /** 分页 + 关键字(名称/AppID)搜索 */
  async findAll(query: QueryMiniappDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    const where: Prisma.MiniProgramWhereInput = query.keyword
      ? {
          OR: [
            { name: { contains: query.keyword } },
            { appid: { contains: query.keyword } },
          ],
        }
      : {};

    const [list, total] = await Promise.all([
      this.prisma.miniProgram.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.miniProgram.count({ where }),
    ]);
    return { list, total, page, pageSize };
  }

  async create(dto: CreateMiniappDto, adminName?: string) {
    const exists = await this.prisma.miniProgram.findUnique({
      where: { appid: dto.appid },
    });
    if (exists) throw new BadRequestException('该 AppID 已存在');

    return this.prisma.miniProgram.create({
      data: {
        name: dto.name,
        appid: dto.appid,
        appSecret: dto.appSecret,
        status: dto.status ?? 1,
        csSwitchable: dto.csSwitchable ?? true,
        remark: dto.remark,
        msgTemplate: dto.msgTemplate,
        token: dto.token,
        encodingAESKey: dto.encodingAESKey,
        adminName: adminName ?? '超级管理员',
      },
    });
  }

  async update(id: number, dto: UpdateMiniappDto) {
    await this.ensureExists(id);
    if (dto.appid) {
      const dup = await this.prisma.miniProgram.findFirst({
        where: { appid: dto.appid, NOT: { id } },
      });
      if (dup) throw new BadRequestException('该 AppID 已被其它小程序占用');
    }
    return this.prisma.miniProgram.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.ensureExists(id);
    await this.prisma.miniProgram.delete({ where: { id } });
    return { success: true };
  }

  async batchRemove(ids: number[]) {
    if (!ids?.length) throw new BadRequestException('请选择要删除的小程序');
    const result = await this.prisma.miniProgram.deleteMany({
      where: { id: { in: ids.map(Number) } },
    });
    return { success: true, count: result.count };
  }

  private async ensureExists(id: number) {
    const item = await this.prisma.miniProgram.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('小程序不存在');
    return item;
  }
}
