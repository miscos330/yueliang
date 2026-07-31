import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /** 顶部 4 张统计卡 */
  @Get('overview')
  overview() {
    return this.statsService.overview();
  }

  /** 实时数据面板 */
  @Get('realtime')
  realtime() {
    return this.statsService.realtime();
  }

  /** 客服工作量列表 */
  @Get('cs-workload')
  csWorkload() {
    return this.statsService.csWorkload();
  }
}
