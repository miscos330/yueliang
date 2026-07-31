import { Module } from '@nestjs/common';
import { SettingModule } from '../setting/setting.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { WechatController } from './wechat.controller';
import { WechatService } from './wechat.service';

@Module({
  imports: [SettingModule],
  controllers: [ChatController, WechatController],
  providers: [ChatService, ChatGateway, WechatService],
})
export class ChatModule {}
