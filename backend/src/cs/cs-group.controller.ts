import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CsService } from './cs.service';
import { CsGroupDto } from './dto/cs-group.dto';

@UseGuards(JwtAuthGuard)
@Controller('cs-group')
export class CsGroupController {
  constructor(private readonly csService: CsService) {}

  @Get()
  findAll() {
    return this.csService.findGroups();
  }

  @Post()
  create(@Body() dto: CsGroupDto) {
    return this.csService.createGroup(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: CsGroupDto) {
    return this.csService.updateGroup(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.csService.removeGroup(id);
  }
}
