import { Module } from '@nestjs/common';
import { CsController } from './cs.controller';
import { CsGroupController } from './cs-group.controller';
import { CsService } from './cs.service';

@Module({
  controllers: [CsController, CsGroupController],
  providers: [CsService],
})
export class CsModule {}
