import { Controller, Get, Inject } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { IWardService } from './interfaces/iward.service'

@ApiTags('wards')
@Controller('wards')
export class WardController {
  constructor(
    @Inject(IWardService)
    private readonly wardService: IWardService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách phường/xã tại khu vực thành phố Hồ Chí Minh',
  })
  getWards() {
    return this.wardService.getWards()
  }
}
