import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CsService } from './cs.service';
import { CreateCsDto } from './dto/create-cs.dto';
import { UpdateCsDto } from './dto/update-cs.dto';
import { QueryCsDto } from './dto/query-cs.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@UseGuards(JwtAuthGuard)
@Controller('cs')
export class CsController {
  constructor(private readonly csService: CsService) {}

  @Get()
  findAll(@Query() query: QueryCsDto) {
    return this.csService.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateCsDto) {
    return this.csService.create(dto);
  }

  @Post(':id/reset-password')
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.csService.resetPassword(id, dto.password);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCsDto) {
    return this.csService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.csService.remove(id);
  }
}
