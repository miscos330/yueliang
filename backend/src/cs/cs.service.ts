import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCsDto } from './dto/create-cs.dto';
import { UpdateCsDto } from './dto/update-cs.dto';
import { QueryCsDto } from './dto/query-cs.dto';
import { CsGroupDto } from './dto/cs-group.dto';

@Injectable()
export class CsService {
  constructor(private readonly prisma: PrismaService) {}

  private sanitize<T extends { password?: string }>(cs: T) {
    const { password, ...rest } = cs;
    return rest;
  }

  // ===================== 账号 =====================

  async findAll(query: QueryCsDto) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    const where: Prisma.CsWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.keyword
        ? {
            OR: [
              { username: { contains: query.keyword } },
              { nickname: { contains: query.keyword } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.cs.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { group: true },
      }),
      this.prisma.cs.count({ where }),
    ]);
    return { list: rows.map((r) => this.sanitize(r)), total, page, pageSize };
  }

  async create(dto: CreateCsDto) {
    const exists = await this.prisma.cs.findUnique({
      where: { username: dto.username },
    });
    if (exists) throw new BadRequestException('该登录账号已存在');

    const cs = await this.prisma.cs.create({
      data: {
        username: dto.username,
        password: await bcrypt.hash(dto.password, 10),
        nickname: dto.nickname,
        role: dto.role ?? 'cs',
        status: dto.status ?? 1,
        remark: dto.remark,
        groupId: dto.groupId ? dto.groupId : null,
      },
    });
    return this.sanitize(cs);
  }

  async update(id: number, dto: UpdateCsDto) {
    await this.ensureExists(id);
    const data: Prisma.CsUpdateInput = {
      nickname: dto.nickname,
      role: dto.role,
      status: dto.status,
      remark: dto.remark,
    };
    // groupId: undefined 不动;0 移出分组;其它连接到对应分组
    if (dto.groupId !== undefined) {
      data.group = dto.groupId
        ? { connect: { id: dto.groupId } }
        : { disconnect: true };
    }
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }
    const cs = await this.prisma.cs.update({ where: { id }, data });
    return this.sanitize(cs);
  }

  async remove(id: number) {
    const cs = await this.ensureExists(id);
    if (cs.role === 'admin') {
      const adminCount = await this.prisma.cs.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        throw new BadRequestException('至少保留一个管理员账号');
      }
    }
    await this.prisma.cs.delete({ where: { id } });
    return { success: true };
  }

  async resetPassword(id: number, password: string) {
    await this.ensureExists(id);
    await this.prisma.cs.update({
      where: { id },
      data: { password: await bcrypt.hash(password, 10) },
    });
    return { success: true };
  }

  private async ensureExists(id: number) {
    const cs = await this.prisma.cs.findUnique({ where: { id } });
    if (!cs) throw new NotFoundException('账号不存在');
    return cs;
  }

  // ===================== 分组 =====================

  async findGroups() {
    const groups = await this.prisma.csGroup.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { members: true } } },
    });
    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      remark: g.remark,
      memberCount: g._count.members,
      createdAt: g.createdAt,
    }));
  }

  async createGroup(dto: CsGroupDto) {
    return this.prisma.csGroup.create({
      data: { name: dto.name, remark: dto.remark },
    });
  }

  async updateGroup(id: number, dto: CsGroupDto) {
    await this.ensureGroup(id);
    return this.prisma.csGroup.update({
      where: { id },
      data: { name: dto.name, remark: dto.remark },
    });
  }

  async removeGroup(id: number) {
    await this.ensureGroup(id);
    // 成员的 groupId 会因 onDelete: SetNull 自动置空
    await this.prisma.csGroup.delete({ where: { id } });
    return { success: true };
  }

  private async ensureGroup(id: number) {
    const g = await this.prisma.csGroup.findUnique({ where: { id } });
    if (!g) throw new NotFoundException('分组不存在');
    return g;
  }
}
