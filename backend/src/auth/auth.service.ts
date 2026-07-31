import {
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cs } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
  sub: number;
  username: string;
  role: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  /** 首次启动:库里没有任何账号时,初始化一个超级管理员 admin/admin123 */
  async onModuleInit() {
    try {
      const count = await this.prisma.cs.count();
      if (count === 0) {
        await this.prisma.cs.create({
          data: {
            username: 'admin',
            password: await bcrypt.hash('admin123', 10),
            nickname: '超级管理员',
            role: 'admin',
            status: 1,
          },
        });
        this.logger.log('已初始化默认管理员账号:admin / admin123');
      }
    } catch (e) {
      this.logger.warn(
        `初始化管理员失败(数据库可能未就绪): ${(e as Error).message}`,
      );
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.cs.findUnique({
      where: { username: dto.username },
    });
    if (!user) throw new UnauthorizedException('用户名或密码错误');
    if (user.status !== 1) throw new UnauthorizedException('账号已被禁用');

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('用户名或密码错误');

    await this.prisma.cs.update({
      where: { id: user.id },
      data: { online: true, lastLoginAt: new Date() },
    });

    const token = await this.jwt.signAsync({
      sub: user.id,
      username: user.username,
      role: user.role,
    } satisfies JwtPayload);
    return { token, user: this.sanitize(user) };
  }

  async getProfile(payload: JwtPayload) {
    const user = await this.prisma.cs.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException('账号不存在');
    return this.sanitize(user);
  }

  private sanitize(user: Cs) {
    const { password, ...rest } = user;
    return rest;
  }
}
