import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StatsModule } from './stats/stats.module';
import { MiniappModule } from './miniapp/miniapp.module';
import { CsModule } from './cs/cs.module';
import { ChatModule } from './chat/chat.module';
import { SettingModule } from './setting/setting.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    StatsModule,
    MiniappModule,
    CsModule,
    ChatModule,
    SettingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
