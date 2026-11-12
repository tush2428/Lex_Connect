
import { Module } from '@nestjs/common';
import { AdvocateController } from './advocate.controller';
import { AdvocateService } from './advocate.service';

@Module({
  controllers: [AdvocateController],
  providers: [AdvocateService],
})
export class AdvocateModule {}
