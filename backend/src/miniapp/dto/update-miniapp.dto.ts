import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateMiniappDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  appid?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  appSecret?: string;

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
}
