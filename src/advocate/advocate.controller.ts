
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  ParseUUIDPipe,
} from '@nestjs/common';

import { AdvocateService } from './advocate.service';

@Controller('advocates')
export class AdvocateController {
  constructor(
    private readonly advocateService: AdvocateService,
  ) {}

  @Post(':userId/profile')
  createProfile(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: any,
  ) {
    return this.advocateService.createProfile(userId, body);
  }

  @Get(':userId/profile')
  getProfile(
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.advocateService.getProfile(userId);
  }
}
