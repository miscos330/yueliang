import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CsGroupDto {
  @IsString()
  @MinLength(1, { message: '分组名不能为空' })
  @MaxLength(32)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string;
}
