import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  /** 健康检查(Render healthCheckPath 用,无需鉴权) */
  @Get('health')
  health() {
    return { ok: true, service: 'yueliang', ts: new Date().toISOString() };
  }
}
