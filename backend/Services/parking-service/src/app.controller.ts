import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'

import { AppService } from './app.service'
import { Roles } from './common/decorators/roles.decorator'
import { RoleEnum } from './common/enum/role.enum'
import { JwtAuthGuard } from './guard/jwtAuth.guard'
import { RolesGuard } from './guard/role.guard'
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.OPERATOR, RoleEnum.DRIVER)
  @ApiBearerAuth()
  getHello(): string {
    return this.appService.getHello()
  }
}
