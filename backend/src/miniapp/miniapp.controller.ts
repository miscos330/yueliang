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
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MiniappService } from './miniapp.service';
import { CreateMiniappDto } from './dto/create-miniapp.dto';
import { UpdateMiniappDto } from './dto/update-miniapp.dto';
import { QueryMiniappDto } from './dto/query-miniapp.dto';

@UseGuards(JwtAuthGuard)
@Controller('miniapp')
export class MiniappController {
  constructor(private readonly miniappService: MiniappService) {}

  @Get()
  findAll(@Query() query: QueryMiniappDto) {
    return this.miniappService.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateMiniappDto, @Req() req: any) {
    return this.miniappService.create(dto, req.user?.username);
  }

  /** 批量删除:body { ids: number[] } */
  @Post('batch-delete')
  batchRemove(@Body('ids') ids: number[]) {
    return this.miniappService.batchRemove(ids);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMiniappDto,
  ) {
    return this.miniappService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.miniappService.remove(id);
  }
}
