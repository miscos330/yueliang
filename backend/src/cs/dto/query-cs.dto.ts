import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryCsDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  // 空串按「不过滤」处理,避免 role='' 触发 IsIn 校验失败
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsIn(['admin', 'cs'])
  role?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}
