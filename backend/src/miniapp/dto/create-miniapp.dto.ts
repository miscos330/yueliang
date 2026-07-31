import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateMiniappDto {
  @IsString()
  @MinLength(1, { message: '小程序名称不能为空' })
  @MaxLength(50)
  name: string;

  @IsString()
  @MinLength(1, { message: 'AppID 不能为空' })
  @MaxLength(64)
  appid: string;

  @IsString()
  @MinLength(1, { message: 'AppSecret 不能为空' })
  @MaxLength(128)
  appSecret: string;

  @IsOptional()
  @IsInt()
  status?: number;

  @IsOptional()
  @IsBoolean()
  csSwitchable?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remark?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  msgTemplate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  token?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  encodingAESKey?: string;
}
