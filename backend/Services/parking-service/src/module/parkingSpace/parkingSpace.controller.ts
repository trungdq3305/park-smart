// src/parking-space/parking-space.controller.ts

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Query,
} from '@nestjs/common'
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { IdDto } from 'src/common/dto/params.dto'

import { ParkingSpaceResponseDto } from './dto/parkingSpace.dto'
import { IParkingSpaceService } from './interfaces/iparkingSpace.service'

@ApiTags('parking-spaces')
@Controller('parking-spaces')
export class ParkingSpaceController {
  constructor(
    @Inject(IParkingSpaceService)
    private readonly parkingSpaceService: IParkingSpaceService,
  ) {}

  // Route: GET 
  @Get()
  @ApiOperation({ summary: 'Lấy tất cả vị trí đỗ xe của một bãi xe' })
  @ApiQuery({
    name: 'parkingLotId',
    description: 'ID của bãi đỗ xe',
    type: String,
  })
  @ApiQuery({
    name: 'level',
    description: 'Tầng của bãi đỗ xe',
    required: true,
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trả về danh sách các vị trí đỗ xe.',
    type: [ParkingSpaceResponseDto],
  })
  async getAllByParkingLotId(
    @Query('parkingLotId') parkingLotId: string,
    @Query('level') level: number,
  ): Promise<ApiResponseDto<ParkingSpaceResponseDto[]>> {
    const spaces = await this.parkingSpaceService.getAllSpacesByParkingLotId(
      parkingLotId,
      level,
    )
    return {
      data: spaces,
      statusCode: HttpStatus.OK,
      message: `Lấy danh sách vị trí đỗ xe của tầng ${String(level)} thành công.`,
      success: true,
    }
  }

  // Route: GET /parking-spaces/:id
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một vị trí đỗ xe' })
  @ApiParam({
    name: 'id',
    description: 'ID của vị trí đỗ xe',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trả về chi tiết vị trí đỗ xe.',
    type: ParkingSpaceResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy vị trí đỗ xe.',
  })
  async findById(
    @Param() { id }: IdDto,
  ): Promise<ApiResponseDto<ParkingSpaceResponseDto>> {
    const space = await this.parkingSpaceService.findById(id)
    return {
      data: [space],
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết vị trí đỗ xe thành công.',
      success: true,
    }
  }
}
