import { Controller, Get, HttpStatus, Inject, Param } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { IdDto } from 'src/common/dto/params.dto'

import { ParkingLotStatusResponseDto } from './dto/parkingLotStatus.dto'
import { IParkingLotStatusService } from './interfaces/iparkingLotStatus.service'

@ApiTags('parking-lot-statuses')
@Controller('parking-lot-statuses')
export class ParkingLotStatusController {
  constructor(
    @Inject(IParkingLotStatusService)
    private readonly parkingLotStatusService: IParkingLotStatusService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách tất cả trạng thái bãi đỗ xe',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Danh sách trạng thái bãi đỗ xe',
    type: ApiResponseDto<ParkingLotStatusResponseDto>, // Trả về một mảng
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy trạng thái nào',
  })
  async getAllParkingLotStatuses(): Promise<
    ApiResponseDto<ParkingLotStatusResponseDto>
  > {
    const statuses =
      await this.parkingLotStatusService.getAllParkingLotStatuses()

    return {
      data: statuses,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách trạng thái thành công',
      success: true,
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết một trạng thái bãi đỗ xe bằng ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chi tiết trạng thái bãi đỗ xe',
    type: ApiResponseDto<ParkingLotStatusResponseDto>, // Chỉ trả về một object
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy trạng thái bãi đỗ xe',
  })
  async getParkingLotStatusById(
    @Param() id: IdDto,
  ): Promise<ApiResponseDto<ParkingLotStatusResponseDto>> {
    const status =
      await this.parkingLotStatusService.getParkingLotStatusById(id)

    return {
      data: [status],
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết trạng thái thành công',
      success: true,
    }
  }
}
