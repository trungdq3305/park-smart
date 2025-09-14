import { Controller, Get, Inject, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { IVehicleTypeService } from './interfaces/ivehicleType.service'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { VehicleTypeResponseDto } from './dto/vehicleTypeResponse.dto'

@ApiTags('vehicle-types')
@Controller('vehicle-types')
export class VehicleTypeController {
  constructor(
    @Inject(IVehicleTypeService)
    private readonly vehicleTypeService: IVehicleTypeService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách loại xe',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách loại xe',
    type: ApiResponseDto<VehicleTypeResponseDto>,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy loại xe nào',
  })
  async getVehicleTypes(): Promise<ApiResponseDto<VehicleTypeResponseDto>> {
    const vehicleTypes = await this.vehicleTypeService.getVehicleTypes()

    return {
      data: vehicleTypes,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách loại xe thành công',
      success: true,
    }
  }
}
