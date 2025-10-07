import { Controller, Get, HttpStatus, Inject, Param } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { IdDto } from 'src/common/dto/params.dto'

import { ParkingSpaceStatusResponseDto } from './dto/parkingSpaceStatus.dto'
import { IParkingSpaceStatusService } from './interfaces/iparkingSpaceStatus.service'

@ApiTags('parking-space-statuses')
@Controller('parking-space-statuses')
export class ParkingSpaceStatusController {
  constructor(
    @Inject(IParkingSpaceStatusService)
    private readonly parkingSpaceStatusService: IParkingSpaceStatusService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách tất cả trạng thái ô đỗ xe',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách trạng thái ô đỗ xe',
    type: ApiResponseDto<ParkingSpaceStatusResponseDto>, // Trả về một mảng
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy trạng thái nào',
  })
  async getAllParkingSpaceStatuses(): Promise<
    ApiResponseDto<ParkingSpaceStatusResponseDto>
  > {
    const statuses =
      await this.parkingSpaceStatusService.getAllParkingSpaceStatuses()

    return {
      data: statuses,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách trạng thái thành công',
      success: true,
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết một trạng thái ô đỗ xe bằng ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chi tiết trạng thái ô đỗ xe',
    type: ApiResponseDto<ParkingSpaceStatusResponseDto>, // Chỉ trả về một object
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy trạng thái ô đỗ xe',
  })
  async getParkingSpaceStatusById(
    @Param() id: IdDto,
  ): Promise<ApiResponseDto<ParkingSpaceStatusResponseDto>> {
    const status =
      await this.parkingSpaceStatusService.getParkingSpaceStatusById(id)

    return {
      data: [status],
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết trạng thái thành công',
      success: true,
    }
  }
}
