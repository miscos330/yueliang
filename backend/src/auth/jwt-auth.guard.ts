import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './auth.service';

/**
 * 简单的 JWT 守卫:从 Authorization: Bearer <token> 里解析并校验,
 * 通过后把 payload 挂到 req.user。
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authHeader: string | undefined = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('未登录');
    }
    const token = authHeader.slice(7);
    try {
      const payload = this.jwt.verify<JwtPayload>(token, {
        secret: this.config.get<string>('JWT_SECRET', 'yueliang-dev-secret'),
      });
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('登录已过期,请重新登录');
    }
  }
}
