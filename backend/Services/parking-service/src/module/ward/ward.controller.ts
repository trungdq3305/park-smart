import { Controller, Get, Inject, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { IWardService } from './interfaces/iward.service'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { WardResponseDto } from './dto/ward.dto'

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
  async getWards(): Promise<ApiResponseDto<WardResponseDto[]>> {
    // 1. Service trả về entity Ward[]
    const wards = await this.wardService.getWards()

    // 2. Interceptor tự động biến đổi wards thành WardResponseDto[]

    // 3. Controller đóng gói vào response cuối cùng
    return {
      data: [wards],
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách khu vực thành công',
      success: true,
    }
  }
}
