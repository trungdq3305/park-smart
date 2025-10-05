import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger'
import { GetCurrenIdOfUserRole } from 'src/common/decorators/getCurrenIdOfUserRole.decorator'
import { GetCurrentUserId } from 'src/common/decorators/getCurrentUserId.decorator'
import { Roles } from 'src/common/decorators/roles.decorator'
import { ApiResponseDto } from 'src/common/dto/apiResponse.dto'
import { PaginatedResponseDto } from 'src/common/dto/paginatedResponse.dto'
import { PaginationQueryDto } from 'src/common/dto/paginationQuery.dto'
import {
  IdDto,
  ParkingLotIdDto,
  ParkingLotStatusIdDto,
} from 'src/common/dto/params.dto'
import { RoleEnum } from 'src/common/enum/role.enum'
import { JwtAuthGuard } from 'src/guard/jwtAuth.guard'

import {
  BoundingBoxDto,
  CoordinatesDto,
  CreateParkingLotDto,
  ParkingLotResponseDto,
  UpdateParkingLotHistoryLogDto,
} from './dto/parkingLot.dto'
import { IParkingLotService } from './interfaces/iparkingLot.service'
import { ParkingLotHistoryLog } from './schemas/parkingLotHistoryLog.schema'

@ApiTags('parking-lots')
@Controller('parking-lots')
export class ParkingLotController {
  constructor(
    @Inject(IParkingLotService)
    private readonly parkingLotService: IParkingLotService,
  ) {}

  // ======= Endpoints cho người dùng (Tìm kiếm) =======

  @Get('nearby')
  @ApiOperation({ summary: 'Tìm các bãi đỗ xe gần một tọa độ (theo bán kính)' })
  @ApiQuery({ name: 'longitude', type: Number, required: true })
  @ApiQuery({ name: 'latitude', type: Number, required: true })
  @ApiQuery({
    name: 'distance',
    type: Number,
    required: true,
    description: 'Bán kính tìm kiếm (km)',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: true,
    description: 'Số trang',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: true,
    description: 'Số lượng mục trên trang',
    example: 20,
  })
  async findNearby(
    @Query() coordinates: CoordinatesDto,
    @Query() paginationQuery: PaginationQueryDto,
    @Query('distance') maxDistanceInKm: number,
  ): Promise<PaginatedResponseDto<ParkingLotResponseDto[]>> {
    const result = await this.parkingLotService.findNearbyParkingLots(
      coordinates,
      paginationQuery,
      maxDistanceInKm,
    )
    return {
      data: [result.data],
      pagination: result.pagination,
      statusCode: HttpStatus.OK,
      message: 'Tìm bãi đỗ xe lân cận thành công',
      success: true,
    }
  }

  @Get('in-bounds')
  @ApiOperation({ summary: 'Tìm các bãi đỗ xe trong một khung nhìn bản đồ' })
  @ApiOperation({ summary: 'Tìm các bãi đỗ xe trong một khung nhìn bản đồ' })
  // --- BỔ SUNG CÁC @ApiQuery Ở ĐÂY ---
  @ApiQuery({
    name: 'bottomLeftLng',
    type: Number,
    required: true,
    description: 'Kinh độ của góc dưới-trái',
  })
  @ApiQuery({
    name: 'bottomLeftLat',
    type: Number,
    required: true,
    description: 'Vĩ độ của góc dưới-trái',
  })
  @ApiQuery({
    name: 'topRightLng',
    type: Number,
    required: true,
    description: 'Kinh độ của góc trên-phải',
  })
  @ApiQuery({
    name: 'topRightLat',
    type: Number,
    required: true,
    description: 'Vĩ độ của góc trên-phải',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: true,
    description: 'Số trang',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: true,
    description: 'Số lượng mục trên trang',
    example: 20,
  })
  async findInBounds(
    @Query() bounds: BoundingBoxDto,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ParkingLotResponseDto[]>> {
    const result = await this.parkingLotService.findParkingLotsInBounds(
      bounds,
      paginationQuery,
    )
    return {
      data: [result.data],
      pagination: result.pagination,
      statusCode: HttpStatus.OK,
      message: 'Tìm bãi đỗ xe trong khu vực thành công',
      success: true,
    }
  }

  // ======= Endpoints cho Quản trị viên (Admin) =======
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN, RoleEnum.OPERATOR)
  @Post()
  @ApiOperation({ summary: 'Tạo một bãi đỗ xe mới (chờ duyệt)' })
  @ApiBody({ type: CreateParkingLotDto })
  async create(
    @Body() createDto: CreateParkingLotDto,
    @GetCurrentUserId() userId: string,
    @GetCurrenIdOfUserRole() currentIdOfUserRole: string,
  ): Promise<ApiResponseDto<ParkingLotResponseDto>> {
    const newParkingLot = await this.parkingLotService.createParkingLot(
      createDto,
      userId,
      currentIdOfUserRole,
    )
    return {
      data: [newParkingLot],
      message: 'Tạo bãi đỗ xe thành công, đang chờ duyệt',
      statusCode: HttpStatus.CREATED,
      success: true,
    }
  }

  @Get('find-for-operator')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.OPERATOR)
  @ApiOperation({ summary: 'Lấy tất cả bãi đỗ xe của một đơn vị vận hành' })
  async findAllForOperator(
    @GetCurrenIdOfUserRole() operatorId: string,
  ): Promise<ApiResponseDto<ParkingLotResponseDto>> {
    const parkingLots =
      await this.parkingLotService.findAllForOperator(operatorId)
    return {
      data: parkingLots,
      message: 'Lấy tất cả bãi đỗ xe thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả bãi đỗ xe cho admin' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN)
  @ApiQuery({
    name: 'parkingLotStatusId',
    type: String,
    required: true,
    description: 'ID của trạng thái cần lọc',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: true,
    description: 'Số trang',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    type: Number,
    required: true,
    description: 'Số lượng mục trên trang',
    example: 20,
  })
  async findAll(
    @Query() parkingLotStatusId: ParkingLotStatusIdDto,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<ParkingLotResponseDto>> {
    const result = await this.parkingLotService.getAllParkingLots(
      paginationQuery,
      parkingLotStatusId.parkingLotStatusId,
    )
    return {
      data: result.data,
      pagination: result.pagination,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách bãi đỗ xe thành công',
      success: true,
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một bãi đỗ xe' })
  @ApiParam({ name: 'id', description: 'ID của bãi đỗ xe' })
  async findById(
    @Param() id: IdDto,
  ): Promise<ApiResponseDto<ParkingLotResponseDto>> {
    const parkingLot = await this.parkingLotService.getParkingLotDetails(id)
    return {
      data: [parkingLot],
      message: 'Lấy chi tiết bãi đỗ xe thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Patch(':id/approve-new-parking-lot')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Duyệt hoặc từ chối một bãi đỗ xe mới' })
  @ApiParam({ name: 'id', description: 'ID của bãi đỗ xe' })
  @ApiBody({ schema: { example: { parkingLotStatusId: '...' } } })
  async approve(
    @Param() parkingLotId: ParkingLotIdDto,
    @Body('parkingLotStatusId') parkingLotStatusId: ParkingLotStatusIdDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const approvedParkingLot =
      await this.parkingLotService.approveNewParkingLot(
        parkingLotId,
        parkingLotStatusId,
        userId,
      )
    return {
      data: [approvedParkingLot.data],
      message: approvedParkingLot.message,
      statusCode: approvedParkingLot.responseCode,
      success: true,
    }
  }

  @Post(':id/send-update-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Gửi yêu cầu cập nhật thông tin bãi đỗ xe' })
  @ApiParam({ name: 'id', description: 'ID của bãi đỗ xe' })
  @ApiBody({ type: UpdateParkingLotHistoryLogDto })
  async requestUpdate(
    @Param() parkingLotId: ParkingLotIdDto,
    @Body() updateDto: UpdateParkingLotHistoryLogDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<ParkingLotHistoryLog>> {
    const historyLog = await this.parkingLotService.sendRequestUpdateParkingLot(
      parkingLotId,
      updateDto,
      userId,
    )
    return {
      data: [historyLog],
      message: 'Gửi yêu cầu cập nhật thành công',
      statusCode: HttpStatus.CREATED,
      success: true,
    }
  }

  @Post(':id/send-delete-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN, RoleEnum.OPERATOR)
  @ApiOperation({ summary: 'Tạo yêu cầu xóa một bãi đỗ xe' })
  @ApiParam({ name: 'id', description: 'ID của bãi đỗ xe' })
  async sendRequestDeleteParkingLot(
    @Param() id: IdDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const result = await this.parkingLotService.sendRequestDeleteParkingLot(
      id,
      userId,
    )
    return {
      data: [result.data],
      message: result.message,
      statusCode: result.responseCode,
      success: true,
    }
  }

  @Patch(':id/approve-update-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Duyệt hoặc từ chối yêu cầu cập nhật bãi đỗ xe' })
  @ApiParam({ name: 'id', description: 'ID của bãi đỗ xe' })
  @ApiBody({ type: ParkingLotStatusIdDto })
  async approveUpdate(
    @Param() parkingLotId: ParkingLotIdDto,
    @Body('parkingLotStatusId') parkingLotStatusId: ParkingLotStatusIdDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ApiResponseDto<boolean>> {
    const updatedParkingLot =
      await this.parkingLotService.approveParkingLotUpdate(
        parkingLotId,
        parkingLotStatusId,
        userId,
      )
    return {
      data: [updatedParkingLot.data],
      message: updatedParkingLot.message,
      statusCode: updatedParkingLot.responseCode,
      success: true,
    }
  }

  @Patch(':id/approve-delete-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Duyệt hoặc từ chối yêu cầu xóa bãi đỗ xe' })
  @ApiParam({ name: 'id', description: 'ID của bãi đỗ xe' })
  @ApiBody({ type: ParkingLotStatusIdDto })
  approveDelete(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  @Get(':id/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Lấy lịch sử cập nhật của một bãi đỗ xe' })
  @ApiParam({ name: 'id', description: 'ID của bãi đỗ xe' })
  async getHistory(
    @Param() parkingLotId: ParkingLotIdDto,
  ): Promise<ApiResponseDto<ParkingLotHistoryLog[]>> {
    const history =
      await this.parkingLotService.getUpdateHistoryLogForParkingLot(
        parkingLotId,
      )
    return {
      data: [history],
      message: 'Lấy lịch sử cập nhật thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }

  @Post(':id/check-real-time-status')
  @ApiParam({ name: 'id', description: 'ID của bãi đỗ xe' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        change: {
          type: 'number',
          description: 'Sự thay đổi số chỗ trống (số dương tăng, số âm giảm)',
        },
      },
      example: {
        change: -1,
      },
    },
  })
  @ApiOperation({
    summary: 'Cập nhật trạng thái thực tế của bãi đỗ xe (dành cho Mobile)',
  })
  async checkRealTimeStatus(
    @Param() id: IdDto,
    @Body('change') change: number,
  ): Promise<ApiResponseDto<boolean>> {
    const result =
      await this.parkingLotService.updateAvailableSpotsForWebsocket(
        id.id,
        change,
      )
    return {
      data: [result],
      message: 'Cập nhật trạng thái thực tế thành công',
      statusCode: HttpStatus.OK,
      success: true,
    }
  }
}
