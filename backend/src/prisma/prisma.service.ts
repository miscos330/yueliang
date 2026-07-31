import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('数据库已连接');
    } catch (e) {
      // MySQL 未启动时不让整个服务崩掉,查询时再报错即可
      this.logger.warn(`数据库未连接(MySQL 可能未启动): ${(e as Error).message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
