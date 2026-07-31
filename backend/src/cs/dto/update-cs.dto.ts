import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateCsDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  nickname?: string;

  @IsOptional()
  @IsIn(['admin', 'cs'], { message: '角色只能是 admin 或 cs' })
  role?: string;

  @IsOptional()
  @IsInt()
  status?: number;

  /** 0 或不传表示不改;传其它值表示改分组(0 = 移出分组) */
  @IsOptional()
  @IsInt()
  groupId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string;

  @IsOptional()
  @IsString()
  @MinLength(6, { message: '密码至少 6 位' })
  @MaxLength(64)
  password?: string;
}
