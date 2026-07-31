import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCsDto {
  @IsString()
  @MinLength(2, { message: '登录账号至少 2 位' })
  @MaxLength(32)
  username: string;

  @IsString()
  @MinLength(6, { message: '密码至少 6 位' })
  @MaxLength(64)
  password: string;

  @IsString()
  @MinLength(1, { message: '昵名不能为空' })
  @MaxLength(32)
  nickname: string;

  @IsOptional()
  @IsIn(['admin', 'cs'], { message: '角色只能是 admin 或 cs' })
  role?: string;

  @IsOptional()
  @IsInt()
  status?: number;

  @IsOptional()
  @IsInt()
  groupId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string;
}
