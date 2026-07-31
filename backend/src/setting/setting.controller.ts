import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SettingService } from './setting.service';

@UseGuards(JwtAuthGuard)
@Controller('setting')
export class SettingController {
  constructor(private readonly setting: SettingService) {}

  @Get()
  getAll() {
    return this.setting.getAll();
  }

  @Put()
  update(@Body() body: Record<string, unknown>) {
    return this.setting.setMany(body);
  }

  // ===== 快捷回复 =====
  @Get('quick-reply')
  listReplies() {
    return this.setting.listReplies();
  }

  @Post('quick-reply')
  createReply(@Body('content') content: string) {
    return this.setting.createReply(content);
  }

  @Patch('quick-reply/:id')
  updateReply(
    @Param('id', ParseIntPipe) id: number,
    @Body('content') content: string,
  ) {
    return this.setting.updateReply(id, content);
  }

  @Delete('quick-reply/:id')
  deleteReply(@Param('id', ParseIntPipe) id: number) {
    return this.setting.deleteReply(id);
  }
}
