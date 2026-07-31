import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  /** 当前客服的会话列表(管理员看全部) */
  @Get('conversations')
  list(@Req() req: any) {
    return this.chat.listConversations(req.user);
  }

  /** 某会话的消息历史 */
  @Get('conversations/:id/messages')
  messages(@Param('id', ParseIntPipe) id: number) {
    return this.chat.getMessages(id);
  }

  /** 标记会话已读 */
  @Post('conversations/:id/read')
  read(@Param('id', ParseIntPipe) id: number) {
    return this.chat.markRead(id);
  }
}
