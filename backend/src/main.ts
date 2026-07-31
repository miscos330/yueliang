import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 所有接口统一挂在 /api 下
  app.setGlobalPrefix('api');

  // 开发期放开跨域(前端 dev server 走 vite 代理,这里也放开以便直连调试)
  app.enableCors({ origin: true, credentials: true });

  // 全局参数校验:自动剔除多余字段并做类型转换
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const port = process.env.PORT || 3100;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🌙 月亮通讯后端已启动: http://localhost:${port}/api`);
}
bootstrap();
